/*
//  Map Object
*/

class Map {

  constructor(token, style, container, center, zoom, mapAnnotations, minZoom = 8, maxZoom = 16) {
    mapboxgl.accessToken = token;
    this.map = new mapboxgl.Map({
        container: container, // container id
        style: style, //stylesheet location
        center: center.coordsJSON(),
        hash: false,
        zoom: zoom,
        minZoom: minZoom,
        maxZoom: maxZoom,
          attributionControl: {
          position: 'bottom-left'
        }
    });
    this.map.addControl(new mapboxgl.NavigationControl());

    this.annotations = mapAnnotations;
  }

}

/*
//  Ranges
//  Labels: 2 > start and end label, 3 > start, mid and end label
*/

var _zoomModifiers = [
  [10, 1.5],
  [12, 3.5],
  [13.5, 8.5],
  [14, 12.5],
  [14.5, 20],
  [15, 25],
  [15.5, 40],
  [16, 45]
];

class MapDataRange {

  constructor(data, labels, dataField = "", interpolationRange = "",targetRange = [10,50], inputModifier = 0.01, inversed = false, zoomModifiers = []){
    this.rangeStart = 0;
    this.rangeEnd = 0;

    this.labels = labels;
    this.dataField = dataField;

    this.inversed = inversed;

    if(data != ""){
      this.fromData(data)
    }

    if(interpolationRange == ""){
      this.interpolationRange = [this.rangeStart,this.rangeEnd];
    } else {
      this.interpolationRange = interpolationRange;
    }

    this.targetRange = targetRange; // Could be calculated automatically
    this.inputModifier = inputModifier; // Same here
    this.zoomModifiers = zoomModifiers;
  }

  fromData(data){
    if(this.inversed){
      this.rangeStart = Math.max(...data);
      this.rangeEnd = Math.min(...data);
    }
    else {
      this.rangeStart = Math.min(...data);
      this.rangeEnd = Math.max(...data);
    }
  }

  interpolateJSON() {
    var json = [];
    json.push("interpolate");
    json.push(["linear"]);
    if(this.zoomModifiers.length != 0){
      json.push(["zoom"]);
      for (var zoom of Object.entries(this.zoomModifiers)){
        var zoomLevel = zoom[1][0];
        var zoomModifier = zoom[1][1];
        json.push(Number(zoomLevel));
        json.push(["*",["*",zoomModifier,this.getJSON()],this.inputModifier]);
      }
    }
    else {
      json.push(this.getJSON());
      json.push(this.targetRange[0]);
      json.push(this.targetRange[1]);
      json.push(this.interpolationRange[0]);
      json.push(this.interpolationRange[1]);
    }
    return json;
  }

  getJSON(){
    return ["get",this.dataField];
  }

}

/*
//  Colortable
//
*/

class MapColorTable {

  constructor(dataField,colorTable){
    this.colorTable = colorTable;
    this.dataField = dataField;
  }

  addMapping(value, color){
    colorTable.push({value: color});
  }

  colorTableJSON(){
    var mb = ["match",["get",this.dataField]];
    for (var [value, color] of Object.entries(this.colorTable)){
      mb.push(value);
      mb.push(color);
    }
    mb.push("hsla(0,0%,0%,0)");
    return mb;
  }
}

/*
//  Source
//
*/

class MapResource {

  constructor(id, type, uri, sourceLayer){
    this.id = id;
    this.type = type;
    this.uri = uri;
    this.sourceLayer = sourceLayer;
  }

  resourceJSON() {
    var json = {};
    json = {};
    json["type"] = this.type;
    switch(this.type){
      case "vector":
        json["url"] = this.uri;
        break;
      case "geojson":
        json["data"] = this.uri;
        break;
      default:
        break;
    }
    return json;
  }

}

/*
//  Paint
//  Types: circle, line, fill, fill-extrusion, symbol
*/

class MapPaint {

  constructor(mainColor, type = "circle", size = 1, opacity = 1, secondaryColor = "transparent", rimBodyRatio = 0.25, haloColor = "#000", haloWidth = 4, dashArray = []){
    this.type = type;
    this.mainColor = mainColor;
    this.secondaryColor = secondaryColor;
    this.rimBodyRatio = rimBodyRatio;
    this.size = size;
    this.opacity = opacity;
    this.haloColor = haloColor;
    this.haloWidth = haloWidth;
    this.dashArray = dashArray;
    this.strokeWidth = rimBodyRatio;
  }

  // mapbox-gl paint json
  paintJSON(){
    var prefix = this.type;
    var paint = {};
    switch (this.type) {
      case "circle":
        paint[prefix + "-radius"] = this.size;
        paint[prefix + "-color"] = this.mainColor;
        paint[prefix + "-opacity"] = this.opacity;
        if(this.rimBodyRatio > 0){
          paint[prefix + "-stroke-color"] = this.secondaryColor;
          paint[prefix + "-stroke-width"] = this.strokeWidth;
        }
        return paint;
        break;
      case "line":
        paint[prefix + "-width"] = this.size;
        paint[prefix + "-color"] = this.mainColor;
        paint[prefix + "-opacity"] = this.opacity;
        if(this.dashArray.length > 0 && this.dashArray != ""){
          paint[prefix + "-dasharray"] = this.dashArray;
        }
        return paint;
        break;
      case "fill":
        paint[prefix + "-color"] = this.mainColor;
        paint[prefix + "-opacity"] = this.opacity;
        paint[prefix + "-outline-color"] = this.secondaryColor;
        return paint;
        break;
      case "fill-extrusion":
        paint[prefix + "-color"] = this.mainColor;
        paint[prefix + "-opacity"] = this.opacity;
        paint[prefix + "-base"] = 0;
        paint[prefix + "-height"] = this.size;
        return paint;
        break;
      case "symbol":
        paint["text-color"] = this.mainColor;
        paint["text-halo-color"] = this.haloColor;
        paint["text-halo-width"] = this.haloWidth;
        return paint;
        break;
      default:
        return paint;
    }
  }

}

/*
//  Layout
*/

class MapLayout {

  constructor(textField, textSize, textJustify="left", textAnchor="left", textOffset=[1,0], textFont = ["Roboto Regular", "Arial Unicode MS Regular"]){
    this.textField = textField;
    this.textSize = textSize;
    this.textJustify = textJustify;
    this.textAnchor = textAnchor;
    this.textOffset = textOffset;
    this.textFont = textFont;
  }

  layoutJSON(){
    return {
      "text-field": ["to-string", ["get", this.textField]],
      "text-font": this.textFont,
      "text-size": this.textSize,
      "text-justify": this.textJustify,
      "text-anchor": this.textAnchor,
      "text-offset": this.textOffset
    };
  }

}

/*
//  Data-Filter
*/

class MapDataFilter {

  constructor(attribute, value, operator="=="){
    this.attribute = attribute;
    this.value = value;
    this.operator = operator;
  }

  filterJSON(){
    return [operator,attribute,value];
  }

}

/*
//  Saved views
*/

class MapCoords {

  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  coordsJSON(){
    return [this.x,this.y];
  }

}

/*
//  Saved views
//  Input for center: either MapCoords or "Latitude,Longitude"
*/

class MapView {

  constructor(id, center, zoom = 12.5){
    this.id = id;
    this.center = center;
    if(center.match(/,/) != null){
      var coords = center.match(/(.+),(.+)/);
      this.setupCenter(Number(coords[1]),Number(coords[2]));
    }
    this.centerJSON = this.center.coordsJSON();
    this.zoom = zoom;
  }

  setupCenter(x,y){
    this.center = new MapCoords(x,y);
  }

  viewJSON(){
    var json = {};
    json["center"] = this.center.coordsJSON();
    json["id"] = this.id;
    json["zoom"] = this.zoom;
    return json;
  }

}

/*
//  Map Legends
//  Types: Range-Circle, Range-Line, Range-Opacity, Categories-Color
*/

class MapLegend {

  constructor(type = "opacity-range", items) {
    this.type = type;
    this.items = items;
  }

  appendToLegend(legend){
    legend.appendChild(document.createElement("p"))

    if(this.type == "opacity-range"){
      for(var [label,value] of Object.entries(this.items.targetRange)){
        var item = document.createElement("div");
        var key = document.createElement("span");
        key.className = "legend-key";
        key.style.backgroundColor = "#fff";
        key.style.opacity = value;

        var value = document.createElement("span");
        value.innerHTML = this.items.labels[label];
        item.appendChild(key);
        item.appendChild(value);
        legend.appendChild(item);
      }
    } else if(this.type == "color-range"){
      for(var [label,value] of Object.entries(this.items)){
        var item = document.createElement("div");
        var key = document.createElement("span");
        key.className = "legend-key";
        key.style.backgroundColor = value;
        key.style.opacity = 1;

        var value = document.createElement("span");
        value.innerHTML = label;
        item.appendChild(key);
        item.appendChild(value);
        legend.appendChild(item);
      }
    } else if(this.type == "circle-size-range"){
      for(var [label,value] of Object.entries(this.items.targetRange)){
        var item = document.createElement("div");
        var key = document.createElement("span");
        key.className = "legend-key";
        key.style.backgroundColor = "transparent";
        key.style.border = "#fff 1px solid";
        key.style.borderRadius = "100%";
        key.style.opacity = 1;
        key.style.margin = "5px";
        key.style.width = value+"px";
        key.style.height = value+"px";

        var value = document.createElement("span");
        value.innerHTML = this.items.labels[label];
        item.appendChild(key);
        item.appendChild(value);
        legend.appendChild(item);
      }
    }

  }

}
