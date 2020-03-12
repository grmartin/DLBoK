# Title     : Attempt EMClustering
# Objective : TODO
# Created by: grmartin
# Created on: 3/12/20

library(rjson)     # JSON
library(purrr)     # map
library(EMCluster) # em
library(plotly)    # plot_ly

K <- 36
BaseDir <- "/Volumes/Data/Play/DLBoK/post-processing"

jsonData <- fromJSON(file = sprintf("%s/expanded_color_data_export.json", BaseDir))
jsonData %>% map("hsluv") %>%
  map(function(x){ unlist(x) %>% as.matrix }) %>%
  unlist %>% matrix(ncol = 3, byrow = TRUE) -> jsonData

emReturn <- em.EM(jsonData, nclass = K)

resultMatrix <- emReturn[["Mu"]]
apply(resultMatrix, FUN=function(x){ list(H=x[1], S=x[2], L=x[3]) }, MARGIN=1) %>%
  toJSON %>%
  write(sprintf("%s/test_%d.json", BaseDir, K))

# colnames(resultMatrix)<-c('H','S','L')

fig <- plot_ly(x = ~resultMatrix[,1],
               y = ~resultMatrix[,2],
               z = ~resultMatrix[,3])
fig <- fig %>% add_markers()
fig <- fig %>% layout(scene = list(xaxis = list(title = 'Hue'),
                                   yaxis = list(title = 'Saturation'),
                                   zaxis = list(title = 'Light')))
fig

