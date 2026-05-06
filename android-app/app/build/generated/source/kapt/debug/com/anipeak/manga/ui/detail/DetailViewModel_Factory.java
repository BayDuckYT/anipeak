package com.anipeak.manga.ui.detail;

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
public final class DetailViewModel_Factory implements Factory<DetailViewModel> {
  private final Provider<SupabaseService> apiProvider;

  public DetailViewModel_Factory(Provider<SupabaseService> apiProvider) {
    this.apiProvider = apiProvider;
  }

  @Override
  public DetailViewModel get() {
    return newInstance(apiProvider.get());
  }

  public static DetailViewModel_Factory create(Provider<SupabaseService> apiProvider) {
    return new DetailViewModel_Factory(apiProvider);
  }

  public static DetailViewModel newInstance(SupabaseService api) {
    return new DetailViewModel(api);
  }
}
