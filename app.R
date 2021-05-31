
# install.packages("tidyverse")
# install.packages("shiny")
# install.packages("r2d3")
# install.packages("d3r")
# install.packages("dplyr")

library(tidyverse)
library(shiny)
library(r2d3)

library(d3r)
library(dplyr)


server <- function(input, output) {
	
	open_ml <- read.csv("open_ml.csv", stringsAsFactors=FALSE)
	
	datah <- reactive({
	  open_ml %>%
		select(tolower(input$packing), name, tolower(input$circleSize)) %>%
		dplyr::rename(value = tolower(input$circleSize)) %>%
		d3_nest(value_cols="value", root="root")
	})
	
	circleGroup <- reactive({
		as.vector(as.matrix(unique(open_ml %>% select(tolower(input$packing))))[,1])
	})
	
	output$d3 <- renderD3({
		r2d3(
			options = list(circleData = datah(), scatterColorDomain = circleGroup(), packing = tolower(input$packing), circleSize = tolower(input$circleSize)),
			data = open_ml,
			script = "d3Plot.js",
			dependencies = "d3-legend.js"
		)
	})
	
}

ui <- fluidPage(
  
	titlePanel("Visualizing open source machine learning projects on GitHub"),
	
	wellPanel(style='padding:0px;',
		fluidRow(		
			column(1),	
			column(5,
				selectInput("packing", label = h4("Circle packing groups based on"), 
					choices = list("Alignment", "Company", "Year", "Language"), 
					selected = 1
				)
			),		
			column(5,
				selectInput("circleSize", label = h4("Circle packing size based on"), 
					choices = list("Stars", "Commits", "Contributors"), 
					selected = 1
				)
			),
			column(1)
		)
	),
	
	mainPanel(
      d3Output("d3")
    )
		
)

shinyApp(ui = ui, server = server)


