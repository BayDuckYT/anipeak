package com.anipeak.manga.data.model;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000,\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\b\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0004\n\u0002\u0010\u0007\n\u0000\n\u0002\u0010 \n\u0000\n\u0002\u0010\u000b\n\u0002\b\u001e\b\u0086\b\u0018\u00002\u00020\u0001BY\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0005\u0012\b\u0010\u0007\u001a\u0004\u0018\u00010\u0005\u0012\u0006\u0010\b\u001a\u00020\u0003\u0012\u0006\u0010\t\u001a\u00020\n\u0012\u000e\u0010\u000b\u001a\n\u0012\u0004\u0012\u00020\u0005\u0018\u00010\f\u0012\u0006\u0010\r\u001a\u00020\u000e\u0012\b\u0010\u000f\u001a\u0004\u0018\u00010\u0005\u00a2\u0006\u0002\u0010\u0010J\t\u0010\u001e\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u001f\u001a\u00020\u0005H\u00c6\u0003J\t\u0010 \u001a\u00020\u0005H\u00c6\u0003J\u000b\u0010!\u001a\u0004\u0018\u00010\u0005H\u00c6\u0003J\t\u0010\"\u001a\u00020\u0003H\u00c6\u0003J\t\u0010#\u001a\u00020\nH\u00c6\u0003J\u0011\u0010$\u001a\n\u0012\u0004\u0012\u00020\u0005\u0018\u00010\fH\u00c6\u0003J\t\u0010%\u001a\u00020\u000eH\u00c6\u0003J\u000b\u0010&\u001a\u0004\u0018\u00010\u0005H\u00c6\u0003Jo\u0010\'\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00052\b\b\u0002\u0010\u0006\u001a\u00020\u00052\n\b\u0002\u0010\u0007\u001a\u0004\u0018\u00010\u00052\b\b\u0002\u0010\b\u001a\u00020\u00032\b\b\u0002\u0010\t\u001a\u00020\n2\u0010\b\u0002\u0010\u000b\u001a\n\u0012\u0004\u0012\u00020\u0005\u0018\u00010\f2\b\b\u0002\u0010\r\u001a\u00020\u000e2\n\b\u0002\u0010\u000f\u001a\u0004\u0018\u00010\u0005H\u00c6\u0001J\u0013\u0010(\u001a\u00020\u000e2\b\u0010)\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010*\u001a\u00020\u0003H\u00d6\u0001J\t\u0010+\u001a\u00020\u0005H\u00d6\u0001R\u0011\u0010\u0006\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0011\u0010\u0012R\u0013\u0010\u0007\u001a\u0004\u0018\u00010\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0013\u0010\u0012R\u0019\u0010\u000b\u001a\n\u0012\u0004\u0012\u00020\u0005\u0018\u00010\f\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0014\u0010\u0015R\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0016\u0010\u0017R\u0016\u0010\r\u001a\u00020\u000e8\u0006X\u0087\u0004\u00a2\u0006\b\n\u0000\u001a\u0004\b\r\u0010\u0018R\u0011\u0010\t\u001a\u00020\n\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0019\u0010\u001aR\u0016\u0010\b\u001a\u00020\u00038\u0006X\u0087\u0004\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001b\u0010\u0017R\u0013\u0010\u000f\u001a\u0004\u0018\u00010\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001c\u0010\u0012R\u0011\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001d\u0010\u0012\u00a8\u0006,"}, d2 = {"Lcom/anipeak/manga/data/model/Series;", "", "id", "", "title", "", "cover", "description", "readsNum", "rating", "", "genre", "", "isTrending", "", "status", "(ILjava/lang/String;Ljava/lang/String;Ljava/lang/String;IFLjava/util/List;ZLjava/lang/String;)V", "getCover", "()Ljava/lang/String;", "getDescription", "getGenre", "()Ljava/util/List;", "getId", "()I", "()Z", "getRating", "()F", "getReadsNum", "getStatus", "getTitle", "component1", "component2", "component3", "component4", "component5", "component6", "component7", "component8", "component9", "copy", "equals", "other", "hashCode", "toString", "app_debug"})
public final class Series {
    private final int id = 0;
    @org.jetbrains.annotations.NotNull()
    private final java.lang.String title = null;
    @org.jetbrains.annotations.NotNull()
    private final java.lang.String cover = null;
    @org.jetbrains.annotations.Nullable()
    private final java.lang.String description = null;
    @com.google.gson.annotations.SerializedName(value = "reads_num")
    private final int readsNum = 0;
    private final float rating = 0.0F;
    @org.jetbrains.annotations.Nullable()
    private final java.util.List<java.lang.String> genre = null;
    @com.google.gson.annotations.SerializedName(value = "is_trending")
    private final boolean isTrending = false;
    @org.jetbrains.annotations.Nullable()
    private final java.lang.String status = null;
    
    public Series(int id, @org.jetbrains.annotations.NotNull()
    java.lang.String title, @org.jetbrains.annotations.NotNull()
    java.lang.String cover, @org.jetbrains.annotations.Nullable()
    java.lang.String description, int readsNum, float rating, @org.jetbrains.annotations.Nullable()
    java.util.List<java.lang.String> genre, boolean isTrending, @org.jetbrains.annotations.Nullable()
    java.lang.String status) {
        super();
    }
    
    public final int getId() {
        return 0;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getTitle() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getCover() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String getDescription() {
        return null;
    }
    
    public final int getReadsNum() {
        return 0;
    }
    
    public final float getRating() {
        return 0.0F;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.util.List<java.lang.String> getGenre() {
        return null;
    }
    
    public final boolean isTrending() {
        return false;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String getStatus() {
        return null;
    }
    
    public final int component1() {
        return 0;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String component2() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String component3() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String component4() {
        return null;
    }
    
    public final int component5() {
        return 0;
    }
    
    public final float component6() {
        return 0.0F;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.util.List<java.lang.String> component7() {
        return null;
    }
    
    public final boolean component8() {
        return false;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String component9() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.anipeak.manga.data.model.Series copy(int id, @org.jetbrains.annotations.NotNull()
    java.lang.String title, @org.jetbrains.annotations.NotNull()
    java.lang.String cover, @org.jetbrains.annotations.Nullable()
    java.lang.String description, int readsNum, float rating, @org.jetbrains.annotations.Nullable()
    java.util.List<java.lang.String> genre, boolean isTrending, @org.jetbrains.annotations.Nullable()
    java.lang.String status) {
        return null;
    }
    
    @java.lang.Override()
    public boolean equals(@org.jetbrains.annotations.Nullable()
    java.lang.Object other) {
        return false;
    }
    
    @java.lang.Override()
    public int hashCode() {
        return 0;
    }
    
    @java.lang.Override()
    @org.jetbrains.annotations.NotNull()
    public java.lang.String toString() {
        return null;
    }
}