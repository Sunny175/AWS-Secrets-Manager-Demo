package com.sunny.AWS_Secrets_Manager_Demo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class MovieSearchResult {
    private Long id;
    private String name;
    private String title;
    private String type;
    private Integer year;
    
    @JsonProperty("imdb_id")
    private String imdbId;
    
    @JsonProperty("tmdb_id")
    private Long tmdbId;
    
    @JsonProperty("tmdb_type")
    private String tmdbType;
    
    @JsonProperty("result_type")
    private String resultType;
    
    private String poster;
    
    @JsonProperty("plot_overview")
    private String plotOverview;
    
    @JsonProperty("user_rating")
    private Double userRating;

    public MovieSearchResult() {}

    public MovieSearchResult(Long id, String name, String title, String type, Integer year, String imdbId, String poster, String plotOverview, Double userRating) {
        this.id = id;
        this.name = name;
        this.title = title;
        this.type = type;
        this.year = year;
        this.imdbId = imdbId;
        this.poster = poster;
        this.plotOverview = plotOverview;
        this.userRating = userRating;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { 
        return name != null ? name : title; 
    }
    public void setName(String name) { this.name = name; }

    public String getTitle() { 
        return title != null ? title : name; 
    }
    public void setTitle(String title) { this.title = title; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }

    public String getImdbId() { return imdbId; }
    public void setImdbId(String imdbId) { this.imdbId = imdbId; }

    public Long getTmdbId() { return tmdbId; }
    public void setTmdbId(Long tmdbId) { this.tmdbId = tmdbId; }

    public String getTmdbType() { return tmdbType; }
    public void setTmdbType(String tmdbType) { this.tmdbType = tmdbType; }

    public String getResultType() { return resultType; }
    public void setResultType(String resultType) { this.resultType = resultType; }

    public String getPoster() { return poster; }
    public void setPoster(String poster) { this.poster = poster; }

    public String getPlotOverview() { return plotOverview; }
    public void setPlotOverview(String plotOverview) { this.plotOverview = plotOverview; }

    public Double getUserRating() { return userRating; }
    public void setUserRating(Double userRating) { this.userRating = userRating; }
}
