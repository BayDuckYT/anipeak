package com.mahorapeak.manga.ui.reader

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mahorapeak.manga.data.api.SupabaseService
import com.mahorapeak.manga.data.model.Chapter
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class ReaderUiState {
    object Loading : ReaderUiState()
    data class Success(val images: List<String>, val chapter: Chapter?) : ReaderUiState()
    data class Premium(val chapter: Chapter) : ReaderUiState()
    data class Error(val message: String) : ReaderUiState()
}

@HiltViewModel
class ReaderViewModel @Inject constructor(
    private val api: SupabaseService
) : ViewModel() {

    private val _uiState = MutableStateFlow<ReaderUiState>(ReaderUiState.Loading)
    val uiState: StateFlow<ReaderUiState> = _uiState

    fun loadChapter(seriesId: Int, chapterId: Int) {
        viewModelScope.launch {
            try {
                val chapter = api.getChapters(seriesId = "eq.$seriesId")
                    .firstOrNull { it.id == chapterId }
                    ?: throw IllegalStateException("Bu bölüm bulunamıyor.")
                if (chapter.isPremium) {
                    _uiState.value = ReaderUiState.Premium(chapter)
                } else if (chapter.pages.isEmpty()) {
                    throw IllegalStateException("Bu bölümde henüz okunabilir sayfa yok.")
                } else {
                    _uiState.value = ReaderUiState.Success(chapter.pages, chapter)
                }
            } catch (e: Exception) {
                _uiState.value = ReaderUiState.Error(e.localizedMessage ?: "Bölüm yüklenemedi. İnternet bağlantını kontrol edip tekrar dene.")
            }
        }
    }
}
