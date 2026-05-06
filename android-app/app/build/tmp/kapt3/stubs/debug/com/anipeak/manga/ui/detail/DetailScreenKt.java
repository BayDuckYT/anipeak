package com.anipeak.manga.ui.detail;

@kotlin.Metadata(mv = {1, 9, 0}, k = 2, xi = 48, d1 = {"\u0000B\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010 \n\u0000\n\u0002\u0018\u0002\n\u0002\u0010\b\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\u001a\u0018\u0010\u0000\u001a\u00020\u00012\u0006\u0010\u0002\u001a\u00020\u00032\u0006\u0010\u0004\u001a\u00020\u0005H\u0007\u001a\u001e\u0010\u0006\u001a\u00020\u00012\u0006\u0010\u0007\u001a\u00020\b2\f\u0010\t\u001a\b\u0012\u0004\u0012\u00020\u00010\nH\u0007\u001a\b\u0010\u000b\u001a\u00020\u0001H\u0007\u001a8\u0010\f\u001a\u00020\u00012\u0006\u0010\r\u001a\u00020\u000e2\f\u0010\u000f\u001a\b\u0012\u0004\u0012\u00020\b0\u00102\u0018\u0010\u0011\u001a\u0014\u0012\u0004\u0012\u00020\u0013\u0012\u0004\u0012\u00020\u0013\u0012\u0004\u0012\u00020\u00010\u0012H\u0007\u001a\u0010\u0010\u0014\u001a\u00020\u00012\u0006\u0010\r\u001a\u00020\u000eH\u0007\u001a4\u0010\u0015\u001a\u00020\u00012\u0006\u0010\u0016\u001a\u00020\u00132\u0018\u0010\u0011\u001a\u0014\u0012\u0004\u0012\u00020\u0013\u0012\u0004\u0012\u00020\u0013\u0012\u0004\u0012\u00020\u00010\u00122\b\b\u0002\u0010\u0017\u001a\u00020\u0018H\u0007\u00a8\u0006\u0019"}, d2 = {"ActionButton", "", "icon", "Landroidx/compose/ui/graphics/vector/ImageVector;", "label", "", "ChapterItem", "chapter", "Lcom/anipeak/manga/data/model/Chapter;", "onClick", "Lkotlin/Function0;", "DetailActions", "DetailContent", "series", "Lcom/anipeak/manga/data/model/Series;", "chapters", "", "onReadClick", "Lkotlin/Function2;", "", "DetailHeader", "DetailScreen", "seriesId", "viewModel", "Lcom/anipeak/manga/ui/detail/DetailViewModel;", "app_debug"})
public final class DetailScreenKt {
    
    @androidx.compose.runtime.Composable()
    public static final void DetailScreen(int seriesId, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function2<? super java.lang.Integer, ? super java.lang.Integer, kotlin.Unit> onReadClick, @org.jetbrains.annotations.NotNull()
    com.anipeak.manga.ui.detail.DetailViewModel viewModel) {
    }
    
    @androidx.compose.runtime.Composable()
    public static final void DetailContent(@org.jetbrains.annotations.NotNull()
    com.anipeak.manga.data.model.Series series, @org.jetbrains.annotations.NotNull()
    java.util.List<com.anipeak.manga.data.model.Chapter> chapters, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function2<? super java.lang.Integer, ? super java.lang.Integer, kotlin.Unit> onReadClick) {
    }
    
    @androidx.compose.runtime.Composable()
    public static final void DetailHeader(@org.jetbrains.annotations.NotNull()
    com.anipeak.manga.data.model.Series series) {
    }
    
    @androidx.compose.runtime.Composable()
    public static final void DetailActions() {
    }
    
    @androidx.compose.runtime.Composable()
    public static final void ActionButton(@org.jetbrains.annotations.NotNull()
    androidx.compose.ui.graphics.vector.ImageVector icon, @org.jetbrains.annotations.NotNull()
    java.lang.String label) {
    }
    
    @androidx.compose.runtime.Composable()
    public static final void ChapterItem(@org.jetbrains.annotations.NotNull()
    com.anipeak.manga.data.model.Chapter chapter, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function0<kotlin.Unit> onClick) {
    }
}