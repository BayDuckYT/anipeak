package com.mahorapeak.manga.di

import com.mahorapeak.manga.data.api.SupabaseService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    private const val BASE_URL = "https://yrcrgkdikkaeccikdzvw.supabase.co/rest/v1/"
    private const val API_KEY = "sb_publishable_hic5fR71xFLQ4TE7ycVBXQ_xdQHkJGO"

    @Provides
    @Singleton
    fun provideSupabaseService(): SupabaseService {
        val logger = HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BODY }
        
        val client = OkHttpClient.Builder()
            .addInterceptor(logger)
            .addInterceptor { chain ->
                val request = chain.request().newBuilder()
                    .addHeader("apikey", API_KEY)
                    .addHeader("Authorization", "Bearer $API_KEY")
                    .build()
                chain.proceed(request)
            }
            .build()

        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(SupabaseService::class.java)
    }
}
