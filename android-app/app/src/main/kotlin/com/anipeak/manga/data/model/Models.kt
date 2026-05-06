package com.anipeak.manga.data.model

import com.google.gson.annotations.SerializedName

data class Series(
    val id: Int,
    val title: String,
    val cover: String,
    val description: String?,
    @SerializedName("reads_num") val readsNum: Int,
    val rating: Float,
    val genre: List<String>?,
    @SerializedName("is_trending") val isTrending: Boolean,
    val status: String?
)

data class Chapter(
    val id: Int,
    @SerializedName("series_id") val seriesId: Int,
    val number: Float,
    val title: String?,
    val pages: List<String>,
    @SerializedName("is_premium") val isPremium: Boolean,
    @SerializedName("created_at") val createdAt: String
)
