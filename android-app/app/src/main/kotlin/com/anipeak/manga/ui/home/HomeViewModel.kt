package com.anipeak.manga.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.anipeak.manga.data.api.SupabaseService
import com.anipeak.manga.data.model.Series
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class HomeUiState {
    object Loading : HomeUiState()
    data class Success(val series: List<Series>) : HomeUiState()
    data class Error(val message: String) : HomeUiState()
}

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val api: SupabaseService
) : ViewModel() {

    private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
    val uiState: StateFlow<HomeUiState> = _uiState

    init {
        loadSeries()
    }

    fun loadSeries() {
        viewModelScope.launch {
            try {
                val series = api.getSeries()
                _uiState.value = HomeUiState.Success(series)
            } catch (e: Exception) {
                _uiState.value = HomeUiState.Error(e.message ?: "Bilinmeyen Hata")
            }
        }
    }
}
