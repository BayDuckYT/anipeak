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
                // In a real app, we'd fetch images for this specific chapter
                // For now, let's simulate with some data
                val images = listOf(
                    "https://images.unsplash.com/photo-1578632738980-43314a5b4529?auto=format&fit=crop&q=80&w=1000",
                    "https://images.unsplash.com/photo-1613376023733-0d743de236ca?auto=format&fit=crop&q=80&w=1000"
                )
                _uiState.value = ReaderUiState.Success(images, null)
            } catch (e: Exception) {
                _uiState.value = ReaderUiState.Error(e.message ?: "Bilinmeyen Hata")
            }
        }
    }
}
