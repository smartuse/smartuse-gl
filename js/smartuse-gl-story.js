/*
// SmartUse GL Story
//
// Storyline Framework, requires smartuse-gl-map
*/

/*
//  Story layer config
*/

class StoryLayerCnf {

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

function loadStory(map,story){
  var storylayer = story.layerToLoad();

  for (var i in storylayer){
    var layer = storylayer[i][0];

    if(!map.getSource(layer.sourceLayer.id)){
      map.addSource(layer.sourceLayer.id,layer.sourceLayer.resourceJSON())

      var style = {};
      style["id"] = layer.sourceLayer.id;
      style["type"] = layer.paint.type;
      style["source"] = layer.sourceLayer.id;
      style["source-layer"] = layer.sourceLayer.sourceLayer;
      style["paint"] = layer.paint.paintJSON();

      map.addLayer(style);

    }
  }

  // for (var [name,layer] of Object.entries(story_annotation_layers)){
  //   var source = layer["id"]
  //   var style = story_annotation_styles[layer["paint"]]
  //   console.log(layer, style)
  //   if(!mapWrapper.map.getSource(layer["id"])){
  //     console.log("adding as source...")
  //     mapWrapper.map.addSource(layer["id"],layer["mapboxSourceParams"])
  //   }
  //   mapWrapper.map.addLayer(style)
  // }

  changeLayerState(mapWrapper.map,0)
}

function changeLayerState(map,newState){

  var newLayerState = story.storyline[newState];
  var storylineID = newLayerState.id;

  var storylayer = story.layerToLoad();

  // Reset Layers
  for (var i in storylayer){
    var layer = storylayer[i][0];
    document.getElementById(i).className = "";
    map.setLayoutProperty(layer.sourceLayer.id,'visibility','none');
  }

  document.getElementById(newState).className = "active"
  document.getElementById("legend").innerHTML = "";

  // Only for enabled ones
  var enabledLayer = newLayerState.layer
  for (var enabled of enabledLayer){
    // Repaint layers
    for (var [name,val] of Object.entries(enabled.paint.paintJSON())){
      map.setPaintProperty(enabled.sourceLayer.id,name,val)
    }

    if(enabled.filter != ""){
      console.log("filtering... ",layer,enabled.filter)
      map.setFilter(enabled.sourceLayer.id,enabled.filter)
    }

    var legends = enabled.legends;
    for (var legend in enabled.legends){
      enabled.legends[legend].appendToLegend(document.getElementById("legend"));
    }

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
