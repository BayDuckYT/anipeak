package com.anipeak.manga.ui.detail

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.anipeak.manga.data.api.SupabaseService
import com.anipeak.manga.data.model.Chapter
import com.anipeak.manga.data.model.Series
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class DetailUiState {
    object Loading : DetailUiState()
    data class Success(val series: Series, val chapters: List<Chapter>) : DetailUiState()
    data class Error(val message: String) : DetailUiState()
}

@HiltViewModel
class DetailViewModel @Inject constructor(
    private val api: SupabaseService
) : ViewModel() {

    private val _uiState = MutableStateFlow<DetailUiState>(DetailUiState.Loading)
    val uiState: StateFlow<DetailUiState> = _uiState

    fun loadDetail(seriesId: Int) {
        viewModelScope.launch {
            try {
                val seriesList = api.getSeries(id = "eq.$seriesId")
                val series = seriesList.first()
                val chapters = api.getChapters(seriesId = "eq.$seriesId")
                _uiState.value = DetailUiState.Success(series, chapters)
            } catch (e: Exception) {
                _uiState.value = DetailUiState.Error(e.message ?: "Hata oluştu")
            }
        }
    }
}
