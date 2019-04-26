/*
//  Map Object
*/

class Map {

  map;

  constructor(token, style, container, center, zoom, minZoom = 8, maxZoom = 16) {
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
  }

}

/*
//  Ranges
//  Labels: 2 > start and end label, 3 > start, mid and end label
*/

var _zoomModifiers = {
  10: 1.5,
  12: 5,
  13.5: 12,
  14: 19
};

class MapDataRange {
  rangeStart = 0;
  rangeEnd = 0;
  labels = [];
  interpolationRange = [];
  targetRange = [];
  relativeSize = 0;
  zoomModifiers = {};
  dataField = "";

  constructor(data, labels, dataField = "", interpolationRange = "",targetRange = [10,50], inputModifier = 0.01, zoomModifiers = {}){
    this.rangeStart = 0;
    this.rangeEnd = 0;

    this.labels = labels;
    this.dataField = dataField;

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
    this.rangeStart = Math.min(...data);
    this.rangeEnd = Math.max(...data);
  }


  interpolateJSON() {
    var json = [];
    json.push("interpolate");
    json.push(["linear"]);
    if(this.zoomModifiers.length != 0){
      json.push(["zoom"]);
      for (var [zoomLevel,zoomModifier] of Object.entries(this.zoomModifiers)){
        json.push(Number(zoomLevel));
        json.push(["*",["*",zoomModifier,this.getJSON()],this.inputModifier]);
      }
    }
    else {
      json.push(this.getJSON());
    }
    json.push(this.targetRange[0],this.interpolationRange[0]);
    json.push(this.targetRange[1],this.interpolationRange[1]);
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
  colorTable;
  dataField;

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
  id;
  type;
  uri;
  sourceLayer;

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
  mainColor = "#000";
  secondaryColor = "transparent";
  size = 10;
  rimBodyRatio = 0.25;
  opacity = 1;
  haloColor = "#000";
  haloWidth = 4;
  dashArray = [];
  type = "circle";

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
  }

  // mapbox-gl paint json
  paintJSON(){
    var prefix = this.type;
    var paint = {}
    switch (this.type) {
      case "circle":
        paint[prefix + "-radius"] = this.size;
        paint[prefix + "-color"] = this.mainColor;
        paint[prefix + "-opacity"] = this.opacity;
        if(this.rimBodyRatio > 0){
          paint[prefix + "-stroke-color"] = this.secondaryColor;
          paint[prefix + "-stroke-width"] = this.size * this.rimBodyRatio;
        }
        return paint;
        break;
      case "line":
        paint[prefix + "-width"] = this.size;
        paint[prefix + "-color"] = this.mainColor;
        paint[prefix + "-opacity"] = this.opacity;
        if(this.dashArray.length > 0){
          paint[prefix + "-dasharray"] = this.dashArray;
        }
        break;
      case "fill":
        return {}
        break;
      case "fill-extrusion":
        return {}
        break;
      case "symbol":
        return {}
        break;
      default:
        return {}
    }
  }

}

/*
//  Layout
*/

class MapLayout {
  textField;
  textSize;
  textJustify;
  textAnchor;
  textOffset;
  textFont;

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
      "text-justify": this.textSize,
      "text-anchor": this.textAnchor,
      "text-offset": this.textOffset
    };
  }

}

/*
//  Data-Filter
*/

class MapDataFilter {
  attribute;
  value;
  operator;

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
  x;
  y;

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
  id;
  center;
  zoom;
  centerJSON;

  constructor(id, center, zoom = 12.5){
    this.id = id;
    this.center = center;
    if(center.match(/,/) != null){
      var coords = center.match(/(.+),(.+)/);
      console.log(coords);
      this.setupCenter(Number(coords[1]),Number(coords[2]);
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

  type = "range-circle";
  items = {};

  constructor(type, items) {
    this.type = type;
    this.items = items;
  }

  appendToLegend(legend){
    legend.appendChild(document.createElement("p"))

    if(this.type = "range-circle"){
      for(var [label,value] of Object.entries(this.items)){
        var item = document.createElement("div");
        var key = document.createElement("span");
        key.className = "legend-key";
        key.style.backgroundColor = "#fff";
        key.style.opacity = value;

        var value = document.createElement("span");
        value.innerHTML = label;
        item.appendChild(key);
        item.appendChild(value);
        legend.appendChild(item);
      }
    } else if(this.type = "range-line"){

    } else if(this.type = "range-opacity"){

    } else if(this.type = "categories-colors"){

    }

  }

}
