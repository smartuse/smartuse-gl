/*
// SmartUse GL Story
//
// Storyline Framework, requires smartuse-gl-map
*/

/*
//  Story layer config
*/

class LayerCnf {
  constructor(layerCnfId,sourceLayer,paint,layout){
    this.sourceLayer = sourceLayer;
    this.layerCnfId = layerCnfId;
    this.paint = paint;
    this.layout = layout;
  }
}

class StoryLayerCnf extends LayerCnf {

  constructor(layerCnfId, sourceLayer, paint, filter, legends = [], layout = ""){
    super(layerCnfId,sourceLayer,paint,layout);
    this.filter = filter;
    this.legends = legends;
  }

  layerJSON() {
    var json = {};
    json["id"] = this.sourceLayer.id;
    json["type"] = this.paint.type;
    json["paint"] = this.paint.paintJSON();
    if(this.filter != ""){
      json["filter"] = this.filter;
    }
    if(this.layout != ""){
      json["layout"] = this.layout.layoutJSON();
    }
    json["legends"] = this.legends;
    json["source"] = this.sourceLayer.id;
    json["source-layer"] = this.sourceLayer.sourceLayer;
    return json;
  }

}

class AnnotationLayerCnf extends LayerCnf {
  constructor(layerCnfId,sourceLayer,type){
    var paint = su_annotation_styles[type];
    var layout = "";
    switch(type){
      case "text":
        layout = su_annotation_layouts[type];
        break;
      default:
        layout = "";
    }

    super(layerCnfId,sourceLayer,paint,layout);
    this.type = type;
  }

  layerJSON() {
    var json = {};
    json["id"] = this.sourceLayer.id;
    json["type"] = this.paint.type;
    json["paint"] = this.paint.paintJSON();
    if(this.type == "text"){
      json["layout"] = this.layout.layoutJSON();
    }
    json["source"] = this.sourceLayer.id;
    json["source-layer"] = this.sourceLayer.sourceLayer;
    return json;
  }
}

/*
//  Story layer state
*/

class StoryLayerState {

  constructor(id, layer, view, title = "", description = "", text = "", icon = new StoryIcon()){
    this.id = id;
    this.layer = layer;
    this.title = title;
    this.description = description;
    this.text = text;
    this.view = view;
    this.icon = icon;
  }

  layerStateJSON(){
    var json = {};
    json["title"] = this.title;
    json["description"] = this.description;
    json["text"] = this.text;
    json["id"] = this.id;
    json["layers"] = this.layer;
    json["view"] = this.view.viewJSON();
    josn["icon"] = this.icon.iconJSON();
    return json;
  }

  [Symbol.iterator]() { return Object.entries(this) }

}

/*
// icon
*/

class StoryIcon {

  constructor(icon="",text=""){
    this.icon = icon;
    this.text = text;
  }

  iconJSON(){
    var json = {};
    json["icon"] = this.icon;
    json["text"] = this.text;
    return json;
  }

  assignIcon(icon){
    var icons = {
      "ors":"route",
      "ors-routing":"route",
      "ors-isochronen":"ruler",
      "transit":"train",
      "statent":"briefcase",
      "statpop":"building",
      "bikeable":"comments",
      "smi":"mobile",
    }
    return (icon in icons) ? icons[icon] : "";
  }

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

function loadStory(mapWrapper,story){
  var storylayer = story.layerToLoad();
  var map = mapWrapper.map;

  for (var i in storylayer){
    var sublayer = storylayer[i];
    for (layer of sublayer){

      if(!map.getSource(layer.sourceLayer.id)){
        map.addSource(layer.sourceLayer.id,layer.sourceLayer.resourceJSON())
        map.addLayer(layer.layerJSON());
      }
    }
  }

  var annotationLayers = mapWrapper.annotations;
  for (var layer of annotationLayers){
    if(!map.getSource(layer.sourceLayer.id)){
      map.addSource(layer.sourceLayer.id,layer.sourceLayer.resourceJSON())
      map.addLayer(layer.layerJSON())
    }
  }

  changeLayerState(mapWrapper.map,0)
}

function changeLayerState(map,newState){

  var newLayerState = story.storyline[newState];
  var storylineID = newLayerState.id;

  var storylayer = story.layerToLoad();

  // Reset Layers
  for (var i in storylayer){
    var sublayer = storylayer[i];
    for (layer of sublayer){
      document.getElementById(i).className = "";
      map.setLayoutProperty(layer.sourceLayer.id,'visibility','none');
    }
  }

  document.getElementById(newState).className = "active"
  document.getElementById("legend").innerHTML = "";

  var subtitle = document.getElementById("story-subtitle");
  subtitle.innerHTML = "";
  var h1 = document.createElement("h1");
  h1.innerText = newLayerState.description;
  subtitle.appendChild(h1);

  var storytext = document.getElementById("story-text");
  storytext.innerHTML = "";
  var p = document.createElement("p");
  p.innerText = newLayerState.text;
  storytext.appendChild(p);

  // Only for enabled ones
  var enabledLayer = newLayerState.layer
  var l = 0;
  for (var enabled of enabledLayer){
    // Repaint layers
    for (var [name,val] of Object.entries(enabled.paint.paintJSON())){
      if(val != ""){
        map.setPaintProperty(enabled.sourceLayer.id,name,val);
      }
    }

    if(enabled.filter != ""){
      map.setFilter(enabled.sourceLayer.id,enabled.filter)
    }

    var legendContainer = document.getElementById("legend");

    var legends = enabled.legends;

    for (var legend in enabled.legends){
      console.log(enabled.legends[legend]);
      enabled.legends[legend].appendToLegend(legendContainer);
      l += 1;
    }

    map.setLayoutProperty(enabled.sourceLayer.id,'visibility','visible');
  }

  legendContainer.className = (l > 0)?"map-overlay active pin-bottomright":"map-overlay";

  // Filter Annotation layer
  if(mapWrapper.annotations.length > 0){
    var annotationLayers = mapWrapper.annotations;
    for (var layer of annotationLayers){
      map.setFilter(layer.sourceLayer.id,["==","storyline-id",newLayerState.id])
    }
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
