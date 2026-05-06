package com.anipeak.manga.di;

@dagger.Module()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u001a\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\b\u00c7\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002J\b\u0010\u0006\u001a\u00020\u0007H\u0007R\u000e\u0010\u0003\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0005\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000\u00a8\u0006\b"}, d2 = {"Lcom/anipeak/manga/di/NetworkModule;", "", "()V", "API_KEY", "", "BASE_URL", "provideSupabaseService", "Lcom/anipeak/manga/data/api/SupabaseService;", "app_debug"})
@dagger.hilt.InstallIn(value = {dagger.hilt.components.SingletonComponent.class})
public final class NetworkModule {
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String BASE_URL = "https://yrcrgkdikkaeccikdzvw.supabase.co/rest/v1/";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String API_KEY = "sb_publishable_hic5fR71xFLQ4TE7ycVBXQ_xdQHkJGO";
    @org.jetbrains.annotations.NotNull()
    public static final com.anipeak.manga.di.NetworkModule INSTANCE = null;
    
    private NetworkModule() {
        super();
    }
    
    @dagger.Provides()
    @javax.inject.Singleton()
    @org.jetbrains.annotations.NotNull()
    public final com.anipeak.manga.data.api.SupabaseService provideSupabaseService() {
        return null;
    }
}