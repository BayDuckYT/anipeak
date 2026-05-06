package com.anipeak.manga.ui.reader;

import com.anipeak.manga.data.api.SupabaseService;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata
@QualifierMetadata
@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava"
})
public final class ReaderViewModel_Factory implements Factory<ReaderViewModel> {
  private final Provider<SupabaseService> apiProvider;

  public ReaderViewModel_Factory(Provider<SupabaseService> apiProvider) {
    this.apiProvider = apiProvider;
  }

  @Override
  public ReaderViewModel get() {
    return newInstance(apiProvider.get());
  }

  public static ReaderViewModel_Factory create(Provider<SupabaseService> apiProvider) {
    return new ReaderViewModel_Factory(apiProvider);
  }

  public static ReaderViewModel newInstance(SupabaseService api) {
    return new ReaderViewModel(api);
  }
}
