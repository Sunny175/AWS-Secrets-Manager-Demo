package com.sunny.AWS_Secrets_Manager_Demo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class MovieDetails {
    private Long id;
    private String title;
    
    @JsonProperty("original_title")
    private String originalTitle;
    
    private String type;
    private Integer year;
    
    @JsonProperty("release_date")
    private String releaseDate;
    
    @JsonProperty("imdb_id")
    private String imdbId;
    
    @JsonProperty("tmdb_id")
    private Long tmdbId;
    
    @JsonProperty("tmdb_type")
    private String tmdbType;
    
    @JsonProperty("user_rating")
    private Double userRating;
    
    @JsonProperty("critic_score")
    private Integer criticScore;
    
    private String poster;
    private String backdrop;
    
    @JsonProperty("plot_overview")
    private String plotOverview;
    
    @JsonProperty("runtime_minutes")
    private Integer runtimeMinutes;
    
    @JsonProperty("genre_names")
    private List<String> genreNames;
    
    private List<StreamingSource> sources;
    private String trailer;
    
    @JsonProperty("trailer_thumbnail")
    private String trailerThumbnail;

    public MovieDetails() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getOriginalTitle() { return originalTitle; }
    public void setOriginalTitle(String originalTitle) { this.originalTitle = originalTitle; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }

    public String getReleaseDate() { return releaseDate; }
    public void setReleaseDate(String releaseDate) { this.releaseDate = releaseDate; }

    public String getImdbId() { return imdbId; }
    public void setImdbId(String imdbId) { this.imdbId = imdbId; }

    public Long getTmdbId() { return tmdbId; }
    public void setTmdbId(Long tmdbId) { this.tmdbId = tmdbId; }

    public String getTmdbType() { return tmdbType; }
    public void setTmdbType(String tmdbType) { this.tmdbType = tmdbType; }

    public Double getUserRating() { return userRating; }
    public void setUserRating(Double userRating) { this.userRating = userRating; }

    public Integer getCriticScore() { return criticScore; }
    public void setCriticScore(Integer criticScore) { this.criticScore = criticScore; }

    public String getPoster() { return poster; }
    public void setPoster(String poster) { this.poster = poster; }

    public String getBackdrop() { return backdrop; }
    public void setBackdrop(String backdrop) { this.backdrop = backdrop; }

    public String getPlotOverview() { return plotOverview; }
    public void setPlotOverview(String plotOverview) { this.plotOverview = plotOverview; }

    public Integer getRuntimeMinutes() { return runtimeMinutes; }
    public void setRuntimeMinutes(Integer runtimeMinutes) { this.runtimeMinutes = runtimeMinutes; }

    public List<String> getGenreNames() { return genreNames; }
    public void setGenreNames(List<String> genreNames) { this.genreNames = genreNames; }

    public List<StreamingSource> getSources() { return sources; }
    public void setSources(List<StreamingSource> sources) { this.sources = sources; }

    public String getTrailer() { return trailer; }
    public void setTrailer(String trailer) { this.trailer = trailer; }

    public String getTrailerThumbnail() { return trailerThumbnail; }
    public void setTrailerThumbnail(String trailerThumbnail) { this.trailerThumbnail = trailerThumbnail; }
}
