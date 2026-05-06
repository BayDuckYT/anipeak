package com.anipeak.manga.data.api;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000$\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\b\u0004\bf\u0018\u00002\u00020\u0001J2\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00040\u00032\b\b\u0001\u0010\u0005\u001a\u00020\u00062\b\b\u0003\u0010\u0007\u001a\u00020\u00062\b\b\u0003\u0010\b\u001a\u00020\u0006H\u00a7@\u00a2\u0006\u0002\u0010\tJ@\u0010\n\u001a\b\u0012\u0004\u0012\u00020\u000b0\u00032\n\b\u0003\u0010\f\u001a\u0004\u0018\u00010\u00062\b\b\u0003\u0010\u0007\u001a\u00020\u00062\b\b\u0003\u0010\r\u001a\u00020\u00062\n\b\u0003\u0010\b\u001a\u0004\u0018\u00010\u0006H\u00a7@\u00a2\u0006\u0002\u0010\u000e\u00a8\u0006\u000f"}, d2 = {"Lcom/anipeak/manga/data/api/SupabaseService;", "", "getChapters", "", "Lcom/anipeak/manga/data/model/Chapter;", "seriesId", "", "select", "order", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getSeries", "Lcom/anipeak/manga/data/model/Series;", "id", "isDeleted", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "app_debug"})
public abstract interface SupabaseService {
    
    @retrofit2.http.GET(value = "series")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getSeries(@retrofit2.http.Query(value = "id")
    @org.jetbrains.annotations.Nullable()
    java.lang.String id, @retrofit2.http.Query(value = "select")
    @org.jetbrains.annotations.NotNull()
    java.lang.String select, @retrofit2.http.Query(value = "is_deleted")
    @org.jetbrains.annotations.NotNull()
    java.lang.String isDeleted, @retrofit2.http.Query(value = "order")
    @org.jetbrains.annotations.Nullable()
    java.lang.String order, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super java.util.List<com.anipeak.manga.data.model.Series>> $completion);
    
    @retrofit2.http.GET(value = "chapters")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getChapters(@retrofit2.http.Query(value = "series_id")
    @org.jetbrains.annotations.NotNull()
    java.lang.String seriesId, @retrofit2.http.Query(value = "select")
    @org.jetbrains.annotations.NotNull()
    java.lang.String select, @retrofit2.http.Query(value = "order")
    @org.jetbrains.annotations.NotNull()
    java.lang.String order, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super java.util.List<com.anipeak.manga.data.model.Chapter>> $completion);
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 3, xi = 48)
    public static final class DefaultImpls {
    }
}