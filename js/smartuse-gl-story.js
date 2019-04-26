/*
// SmartUse GL Story
//
// Storyline Framework, requires smartuse-gl-map
*/

/*
//  Story layer config
*/

class StoryLayerCnf {
  layerCnfId = "";
  sourceLayer; // MapResource
  paint; // MapPaint
  filter = "";
  legends = [];

  constructor(layerCnfId, sourceLayer, paint, filter, legends = []){
    this.layerCnfId = layerCnfId;
    this.paint = paint;
    this.filter = filter;
    this.legends = legends;
    this.sourceLayer = sourceLayer;
  }

  layerJSON() {
    var json = {};
    json["id"] = this.layerCnfId;
    json["paint"] = this.paint.paintJSON();
    json["filter"] = this.filter;
    json["legends"] = this.legends;
    json["source"] = this.sourceLayer.source;
    json["source-layer"] = this.sourceLayer.sourceLayer;
    return json;
  }

}

/*
//  Story layer state
*/

class StoryLayerState {
  id = "";

  layer = []; // Array of StoryLayerCnf()

  title = "";
  description = "";
  text = "";

  view; // MapView

  constructor(id, layer, view, title = "", description = "", text = ""){
    this.id = id;
    this.layer = layer;
    this.title = title;
    this.description = description;
    this.text = text;
    this.view = view;
  }

  layerStateJSON(){
    var json = {};
    json["title"] = this.title;
    json["description"] = this.description;
    json["text"] = this.text;
    json["id"] = this.id;
    json["layers"] = this.layer;
    json["view"] = this.view.viewJSON();
    return json;
  }

  [Symbol.iterator]() { return Object.entries(this) }

}


/*
//  Storyline
*/

class StoryBoard {

  storyline = []; // Array of StoryLayerState()

  constructor(layerStates = []){
    this.storyline = layerStates;
  }

  layerToLoad(){
    var layer = [];
    for (var frame in this.storyline) {
      layer.push(this.storyline[frame].layer);
    }
    return layer;
  }

  printStoryList(listContainer) {
    var i = 0
    for (var story_point in this.storyline){
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.id = i;
      a.onclick = this.changeStory;
      a.innerText = (i+1).toString() + ". " + story.storyline[story_point].title;
      li.appendChild(a);
      listContainer.appendChild(li);

      i++;
    }
  }

  changeStory(element){
    changeLayerState(mapWrapper.map,element.srcElement.id);
  }

}

//
// Interface functions
//

function changeLayerState(map,newState){


  var newLayerState = story.storyline[newState];
  console.log(newLayerState,newState);
  var storylineID = newLayerState.id;

  var storylayer = story.layerToLoad();

  console.log("Changing states...",newLayerState);

  // Reset Layers
  for (var i in storylayer){
    var layer = storylayer[i][0];
    map.setLayoutProperty(layer.sourceLayer.id,'visibility','none');
  }

  // var l = 0;
  // for (story_point of story_layer_states){
  //   document.getElementById(l).className = ""
  //   l++
  // }

  document.getElementById(newState).className = "active"

  // Only show enabled ones
  var enabledLayer = newLayerState.layer
  for (var enabled of enabledLayer){
    map.setLayoutProperty(enabled.sourceLayer.id,'visibility','visible');
  }

  //Set zoom and centerpoint
  map.flyTo({
    'center': newLayerState.view.centerJSON,
    'zoom': newLayerState.view.zoom
  });

  // Set Filter

  // ---- Filter Annotation Layers
  // for (var [name,layer] of Object.entries(story_annotation_layers)){
  //   var filter = ["==","storyline-id",storylineID]
  //   map.setFilter(layer["id"],filter)
  // }
  // 
  // // ---- Filter Map Layers
  // if(Object.keys(newLayerState["filters"]).length > 0){
  //   for (var [layer,filter] of Object.entries(newLayerState["filters"])){
  //     console.log("filtering... ",layer,filter)
  //     map.setFilter(layer,filter)
  //   }
  // }
  //
  // // Repaint layers
  // if(Object.keys(newLayerState["paint-update"]).length>0){
  //   for (var [layer,state] of Object.entries(newLayerState["paint-update"])){
  //     var newStyle = smartuse_styles[state]
  //     for (var [name,val] of Object.entries(newStyle["paint"])){
  //       map.setPaintProperty(layer,name,val)
  //     }
  //   }
  // }
  //
  // // Update legends
  // document.getElementById("legend").innerHTML = "";
  //
  // if(Object.keys(newLayerState["legends"]).length > 0){
  //   for (var [layer,legend] of Object.entries(newLayerState["legends"])){
  //     console.log(layer,legend)
  //     updateLegend(legend);
  //   }
  // }
}

function tilt(map,eh){
  var state = !eh ? {pitch:0, klass:[''], extrusionopacity: 0, fillopacity:0.5} : {pitch:50, klass:['tilted'], extrusionopacity: 0.6, fillopacity:0}

  //document.querySelector('#legends').className = 'pin-bottomright scale '+state.klass[0]
  map
    .easeTo({pitch: state.pitch})
    .setPaintProperty('extrusions', 'fill-extrusion-opacity',state.extrusionopacity)
    .setPaintProperty('fills', 'fill-opacity',state.fillopacity)
}

function toggleLabels(map,truthiness){
  var visibility = truthiness ? 'visible' : 'none'
  map.style.stylesheet.layers.forEach(function(layer){
    if (layer.type === 'symbol') map.setLayoutProperty(layer.id, 'visibility', visibility)
  })
}

/*
//  Building list
*/

/*
//  Switching Layer States
*/
