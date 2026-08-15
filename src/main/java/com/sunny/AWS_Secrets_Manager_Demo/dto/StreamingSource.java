package com.sunny.AWS_Secrets_Manager_Demo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class StreamingSource {
    private Long id;
    private String name;
    private String type; // sub, rent, buy, free
    private String region;
    
    @JsonProperty("web_url")
    private String webUrl;
    
    private String format;
    private Double price;

    public StreamingSource() {}

    public StreamingSource(Long id, String name, String type, String region, String webUrl, String format, Double price) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.region = region;
        this.webUrl = webUrl;
        this.format = format;
        this.price = price;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }

    public String getWebUrl() { return webUrl; }
    public void setWebUrl(String webUrl) { this.webUrl = webUrl; }

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
}
