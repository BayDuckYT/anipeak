package com.anipeak.manga.data.api

import com.anipeak.manga.data.model.Series
import com.anipeak.manga.data.model.Chapter
import retrofit2.http.*

interface SupabaseService {
    @GET("series")
    suspend fun getSeries(
        @Query("id") id: String? = null,
        @Query("select") select: String = "*",
        @Query("is_deleted") isDeleted: String = "eq.false",
        @Query("order") order: String? = "is_trending.desc,reads_num.desc"
    ): List<Series>

    @GET("chapters")
    suspend fun getChapters(
        @Query("series_id") seriesId: String,
        @Query("select") select: String = "*",
        @Query("order") order: String = "number.desc"
    ): List<Chapter>
}
