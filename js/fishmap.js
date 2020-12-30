var settings = {
    selectors: {
        btnForwards: '#btn-forwards',
        btnBackwards: '#btn-backwards',
        btnPlay: '#btn-play',
        sliderTimeline: '#slider-timeline',
        timestamp: '#timestamp',
        chkWeirBefore: '#weir-before',
        chkWeirAfter: '#weir-after',
        sliderTemperature: '#slider-temperature',
        valueTemperature: '#value-temperature',
        sliderFlow: '#slider-flow',
        valueFlow: '#value-flow',
        filters: '.filters',
        mobileFilters: '.mobile-filters'
    },

    dataPoints: [],
    filteredDataPoints: [],

    filters: {
        fishSpecies: [true, true, true, true, true],
        minTemperature: 0,
        maxTemperature: 30,
        minFlow: 0,
        maxFlow: 500,
        beforeWeir: true,
        afterWeir: true,
    },

    map: null,
    centerGeoPoint: [52.1704, -2.242],
    weirGeoPoint : [52.169761, -2.247113],
    currentIndex: 0,
    currentMarker: null,
    smallRadius: 5,
    largeRadius: 10,
    currentTimestamp: "2018-05-25 00:00:00",
    currentTimeIncrement: 5,
    timelineTimeOffset: 30,
    playingAnimation: false,
    timeFactor: 1, //number of seconds for a day to pass in timeline. if this is 1, 1 sec = 1 day; if this is 2, 2 sec = 1 day
    firstTimeIndexSearch: false,
    weirDate: "2018-09-21",

    relativeMinTime: "9999-01-01 00:00:00",
    relativeMaxTime: "0000-01-01 00:00:00",
    absoluteMinTime: "9999-01-01 00:00:00",
    absoluteMaxTime: "0000-01-01 00:00:00",

    iconBarbel: null,
    iconShad: null,
    iconZander: null,
    iconPike: null,
    iconSeaLamprey: null,

    colorBarbel: "#e60000",
    colorPike: "#226426",
    colorZander: "#000",
    colorSeaLamprey: "#2b55bf",
    colorShad: "#ff00ff",
    colorMultiple: "#ff7800",

    MS_PER_DAY: 1000 * 60 * 60 * 24

}, behaviours = {
    init: function () {
        settings.map = L.map('mapid', {preferCanvas: true}).setView(settings.centerGeoPoint, 15); //coordinates, zoom
        L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 18,
            id: 'mapbox/streets-v11',
            tileSize: 512,
            zoomOffset: -1,
            accessToken: 'pk.eyJ1IjoibWlndWVsbHVjYXMiLCJhIjoiY2tkZWtpcDF0MjdoNzJ6czhheXo2enI2OSJ9.Hhj3yCPeNed36iOgdut4xw' //change token when in prod
        }).addTo(settings.map);

        settings.iconBarbel = L.icon({
            iconUrl: 'media/icon_barbel.png',
            iconSize: [40, 20],
            iconAnchor: [20, 10],
            popupAnchor: [20, 10]
        });

        settings.iconPike = L.icon({
            iconUrl: 'media/icon_pike.png',
            iconSize: [40, 20],
            iconAnchor: [20, 10],
            popupAnchor: [20, 10]
        });

        settings.iconSeaLamprey = L.icon({
            iconUrl: 'media/icon_lamprey.png',
            iconSize: [40, 20],
            iconAnchor: [20, 10],
            popupAnchor: [20, 10]
        });

        settings.iconShad = L.icon({
            iconUrl: 'media/icon_shad.png',
            iconSize: [40, 20],
            iconAnchor: [20, 10],
            popupAnchor: [20, 10]
        });

        settings.iconZander = L.icon({
            iconUrl: 'media/icon_zander.png',
            iconSize: [40, 20],
            iconAnchor: [20, 10],
            popupAnchor: [20, 10]
        });

        placeWeirMarkers();

        //parseJSON();
        getJSONData();
        createTemperatureSlider();
        createFlowSlider();

        $(window).on("resize", resizeFilters);
        resizeFilters();
    },
    initEvents: function () {
        $(settings.selectors.btnForwards).on('click', function () {
            //stop animations on click of any button
            if (settings.playingAnimation) {
                stopAllAnimations();
            }

            let newDate = addtoDate(settings.currentTimestamp, settings.currentTimeIncrement);

            if (newDate > new Date(settings.relativeMaxTime)) {
                newDate = new Date(settings.relativeMaxTime);
            }

            settings.currentTimestamp = newDate.toISOString().split("T")[0];
            let slider = document.getElementById('noui-slider');
            slider.noUiSlider.set([null, newDate.getTime(), null]);

        });

        $(settings.selectors.btnBackwards).on('click', function () {
            //stop animations on click of any button
            if (settings.playingAnimation) {
                stopAllAnimations();
            }

            let newDate = addtoDate(settings.currentTimestamp, -settings.currentTimeIncrement);

            if (newDate < new Date(settings.relativeMinTime)) {
                newDate = new Date(settings.relativeMinTime);
            }

            settings.currentTimestamp = newDate.toISOString().split("T")[0];
            let slider = document.getElementById('noui-slider');
            slider.noUiSlider.set([null, newDate.getTime(), null]);
            slider.noUiSlider.set([null, newDate.getTime(), null]);
        });

        $(settings.selectors.btnPlay).on('click', function () {
            settings.playingAnimation = !settings.playingAnimation;
            if (settings.playingAnimation) {
                $(this).html("Stop");
                playAnimation();
            } else {
                $(this).html("Play");
                stopAllAnimations();
            }
        });

        /*settings.map.on('zoomstart', function() {
            if (settings.currentMarker){
                settings.currentMarker.pause();
            }
        });

        settings.map.on('zoomend', function() {
            if (settings.currentMarker){
                settings.currentMarker.start();
            }
        });*/

        let species = $('.checkbox-species');
        for (let i=0; i < species.length; i++) {
            $(species[i]).on('click', function (){
                if (settings.playingAnimation) {
                    stopAllAnimations();
                }

                settings.filters.fishSpecies[i] = species[i].checked;
                applyFilters();
            });
        }

        $(settings.selectors.chkWeirBefore).on('change', function (){
            //stop animations on click of any button
            if (settings.playingAnimation) {
                stopAllAnimations();
            }

           settings.filters.beforeWeir = this.checked;

           //both checkboxes cannot be unchecked at the same time
           if (!settings.filters.beforeWeir) {
               settings.filters.afterWeir = true;
               $(settings.selectors.chkWeirAfter).prop( "checked", true );
           }
           applyFilters();
        });

        $(settings.selectors.chkWeirAfter).on('change', function (){
            //stop animations on click of any button
            if (settings.playingAnimation) {
                stopAllAnimations();
            }

            settings.filters.afterWeir = this.checked;

            //both checkboxes cannot be unchecked at the same time
            if (!settings.filters.afterWeir) {
                settings.filters.beforeWeir = true;
                $(settings.selectors.chkWeirBefore).prop( "checked", true );
            }

            applyFilters();
        });
    }
};

/**
 * Transforms the raw json file into one usable for the app. Takes a few seconds to run. Activate this function only if the original json file is modified.
 */
function parseJSON() {
    $.getJSON( "data/raw_data.json", function( data ) {
        console.log("JSON being saved");

        let allPoints = {};

        $.each( data, function( key, val ) {
            //TODO: Configure marker here (color, size, etc)
            let dateObj = new Date(val.Timestamp);
            let date = dateObj.getFullYear() + "-" + (dateObj.getMonth()+1) + "-" + dateObj.getDate();

            if (val.Transmitter in allPoints) {
                //set min and max dates
                if (new Date(date).valueOf() < new Date(allPoints[val.Transmitter].minTimestamp).valueOf()) {
                    allPoints[val.Transmitter].minTimestamp = date;
                }

                if (new Date(date).valueOf() > new Date(allPoints[val.Transmitter].maxTimestamp).valueOf()) {
                    allPoints[val.Transmitter].maxTimestamp = date;
                }

                //set min and max temperature
                if (val.Temp > allPoints[val.Transmitter].maxTemperature) {
                    allPoints[val.Transmitter].maxTemperature = val.Temp;
                }

                if (val.Temp < allPoints[val.Transmitter].minFlow) {
                    allPoints[val.Transmitter].minTemperature = val.Temp;
                }

                //set min and max flow
                if (val.flow > allPoints[val.Transmitter].maxFlow) {
                    allPoints[val.Transmitter].maxFlow = val.flow;
                }

                if (val.flow < allPoints[val.Transmitter].minFlow) {
                    allPoints[val.Transmitter].minFlow = val.flow;
                }

                let found = false;
                $.each( allPoints[val.Transmitter].geoPoints, function( key2, val2 ) {
                    if (date == val2.timestamp) {
                        val2.times.push({
                            lat: val.Latitude,
                            lon: val.Longitude,
                            timestamp: val.Timestamp
                        });
                        val2.ntimes = val2.times.length;
                        found = true;
                    }
                });


                if (!found) {
                    allPoints[val.Transmitter].geoPoints.push({
                        lat: val.Latitude,
                        lon: val.Longitude,
                        timestamp: date,
                        ntimes: 1,
                        temperature: val.Temp,
                        flow: val.flow,
                        times: [{
                            lat: val.Latitude,
                            lon: val.Longitude,
                            timestamp: val.Timestamp
                        }]
                    });
                }

            } else {
                let newTransmitter = {
                    minTimestamp: date,
                    maxTimestamp: date,
                    minTemperature: val.Temp,
                    maxTemperature: val.Temp,
                    minFlow: val.flow,
                    maxFlow: val.flow,
                    species: val.Species,
                    length: val.Length,
                    currentGeoPointIndex: 0,
                    geoPoints: []
                };

                newTransmitter.geoPoints.push({
                    lat: val.Latitude,
                    lon: val.Longitude,
                    timestamp: date,
                    ntimes: 1,
                    temperature: val.Temp,
                    flow: val.flow,
                    times: [{
                        lat: val.Latitude,
                        lon: val.Longitude,
                        timestamp: val.Timestamp,
                    }]
                });

                allPoints[val.Transmitter] = newTransmitter;
            }

            if (new Date(val.Timestamp) < new Date(settings.absoluteMinTime)){
                settings.absoluteMinTime = date;
            }

            if (new Date(val.Timestamp) > new Date(settings.absoluteMaxTime)){
                settings.absoluteMaxTime = date;
            }

            //destruct obj
            dateObj = null;
        });

        settings.dataPoints = allPoints;
        let newjson = JSON.stringify(allPoints);

            $.ajax
            ({
                type: "POST",
                dataType : 'json',
                async: false,
                url: 'http://localhost/fish-app/save_json.php',
                data: { data: newjson}
            }).fail(function(request, status, exception) {
                console.log(exception);
            }).always(function() { alert("Complete saving new JSON file"); });


    });
}

function applyFilters(){
    eraseAllMarkers();
    settings.filteredDataPoints = {};

    $.each( settings.dataPoints, function( key, val ) {

        let speciesFilter = false;
        let temperatureFilter = false;
        let flowFilter = false;

        //SPECIES FILTERS

        if (settings.filters.fishSpecies[0] && val.species === "Barbel") {
            speciesFilter = true;
        }

        if (settings.filters.fishSpecies[1] && val.species === "Sea lamprey") {
            speciesFilter = true;
        }

        if (settings.filters.fishSpecies[2] && val.species === "Pike") {
            speciesFilter = true;
        }

        if (settings.filters.fishSpecies[3] && val.species === "Twaite shad") {
            speciesFilter = true;
        }

        if (settings.filters.fishSpecies[4] && val.species === "Zander") {
            speciesFilter = true;
        }

        //TEMPERATURE FILTERS
        if (val.minTemperature >= settings.filters.minTemperature && val.maxTemperature <= settings.filters.maxTemperature) {
            temperatureFilter = true;
        }

        //FLOW FILTERS
        if (val.minFlow >= settings.filters.minFlow && val.maxFlow <= settings.filters.maxFlow) {
            flowFilter = true;
        }

        if (speciesFilter && temperatureFilter && flowFilter) {
            settings.filteredDataPoints[key] = val;
        }
    });

    findRelativeMinMax();
    placeMarkers();
}

function getJSONData(){
    $.getJSON( "data/parsed_data.json", function( data ) {
        $.each( data, function( key, val ) {
            //define absolute date limits
            if (new Date(val.minTimestamp) < new Date(settings.absoluteMinTime)){
                settings.absoluteMinTime = val.minTimestamp;
            }

            if (new Date(val.maxTimestamp) > new Date(settings.absoluteMaxTime)){
                settings.absoluteMaxTime = val.maxTimestamp;
            }
        });

        settings.dataPoints = data;
        settings.filteredDataPoints = data;

        findRelativeMinMax();
        findFirstTimeMarkers();
    });
}

function findRelativeMinMax() {
    settings.relativeMinTime = "9999-01-01 00:00:00";
    settings.relativeMaxTime = "0000-01-01 00:00:00";

    let originalMinTime = settings.relativeMinTime;
    let originalMaxTime = settings.relativeMaxTime;

    if (!settings.filters.beforeWeir) {
        settings.relativeMinTime = settings.weirDate;
    }

    if (!settings.filters.afterWeir) {
        settings.relativeMaxTime = settings.weirDate;
    }

    $.each( settings.filteredDataPoints, function( key, val ) {
        if (new Date(val.minTimestamp) < new Date(settings.relativeMinTime) && settings.filters.beforeWeir) {
            settings.relativeMinTime = val.minTimestamp;
        }

        if (new Date(val.maxTimestamp) > new Date(settings.relativeMaxTime) && settings.filters.afterWeir) {
            settings.relativeMaxTime = val.maxTimestamp;
        }
    });

    if (settings.relativeMinTime === originalMinTime || settings.relativeMaxTime === originalMaxTime) {
        return;
    }

    buildTimelineSlider();
}

function buildTimelineSlider() {
    let slider = document.getElementById('noui-slider');

    if (slider.noUiSlider) {
        slider.noUiSlider.set([new Date(settings.relativeMinTime).getTime(), null, new Date(settings.relativeMaxTime).getTime()]);
    } else {
        noUiSlider.create(slider, {
            start: [new Date(settings.relativeMinTime).getTime(),new Date(settings.currentTimestamp).getTime(), /*new Date("2016-06-01").getTime(),*/  new Date(settings.relativeMaxTime).getTime()],
            connect: true,
            tooltips: [true,true, true],
            behaviour: 'drag',
            range: {
                'min': new Date(settings.absoluteMinTime).getTime(),
                'max': new Date(settings.absoluteMaxTime).getTime()
            },
            format: {
                // 'to' the formatted value. Receives a number.
                to: function (value) {
                    var d = new Date(value);
                    let date_string = ("0" + d.getDate()).slice(-2) + '/' + ("0" + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear()
                    //let date_string = d.getFullYear() + '/' + ("0" + (d.getMonth() + 1)).slice(-2) + '/' + ("0" + d.getDate()).slice(-2);
                    return date_string;
                },
                // 'from' the formatted value.
                // Receives a string, should return a number.
                from: function (value) {
                    return Number(value);
                }
            }
        });

        slider.noUiSlider.on('update', function( values, handle ) {
            if (!settings.playingAnimation) {
                let timestamp = slider.noUiSlider.get()[1];

                if (timestamp !== settings.currentTimestamp) {
                    let dateSplitted = timestamp.split("/");
                    let dateFormatted = dateSplitted[2] + "/" + dateSplitted[1] + "/" + dateSplitted[0];

                    let oldTimestamp = settings.currentTimestamp;
                    settings.currentTimestamp = dateFormatted;
                    findCurrentTimeMarkers(oldTimestamp);
                }
            }
        });

        /*let connect = slider.querySelectorAll('.noUi-connect');
        let classes = ['c-1-color', 'c-2-color', 'c-1-color'];

        for (let i = 0; i < connect.length; i++) {
            connect[i].classList.add(classes[i]);
        }*/

        //disable first and last handle
        let origins = slider.getElementsByClassName('noUi-origin');
        origins[0].setAttribute('disabled', true);
        origins[2].setAttribute('disabled', true);

        //shrink disabled handles
        let handles = slider.getElementsByClassName('noUi-handle');
        handles[0].classList.add("handle-disabled");
        handles[2].classList.add("handle-disabled");

        let tooltips = slider.getElementsByClassName('noUi-tooltip');
        tooltips[0].classList.add("left-tooltip-adjust");

        origins[0].classList.add("z-index-low");

        mergeTooltips(slider, 40, ' - ');
    }
}

function findFirstTimeMarkers() {
    settings.firstTimeIndexSearch = true;

    for (const [transmitter_id, transmitter_data] of Object.entries(settings.filteredDataPoints)) {

        //current timestamp is lower than the first date of the transmitter, then current index is the first one
        if (new Date(settings.currentTimestamp) < new Date(transmitter_data.minTimestamp) ) {
            settings.filteredDataPoints[transmitter_id].currentGeoPointIndex = 0;
            continue;
        }

        //current timestamp is higher than the last date of the transmitter, then current index is the last one
        if (new Date(settings.currentTimestamp) > new Date(transmitter_data.maxTimestamp) ) {
            settings.filteredDataPoints[transmitter_id].currentGeoPointIndex = transmitter_data.geoPoints.length-1;
            continue;
        }

        for (const [index, item] of transmitter_data.geoPoints.entries()) {
            if (new Date(item.timestamp) > new Date(settings.currentTimestamp)) {
                settings.filteredDataPoints[transmitter_id].currentGeoPointIndex = index;
                break;
            }
        }
    }

    placeMarkers();
}

/**
 *
 * @param oldTimestamp used to know if timeline went forwards or backwards
 */
function findCurrentTimeMarkers(oldTimestamp) {
    if (!settings.firstTimeIndexSearch) {
        return;
    }

    for (const [transmitter_id, transmitter_data] of Object.entries(settings.filteredDataPoints)) {

        deleteMarker(transmitter_id, transmitter_data);

        //current timestamp is lower than the first date of the transmitter, then current index is the first one
        if (new Date(settings.currentTimestamp) < new Date(transmitter_data.minTimestamp) ) {
            settings.filteredDataPoints[transmitter_id].currentGeoPointIndex = 0;
            continue;
        }

        //current timestamp is higher than the last date of the transmitter, then current index is the last one
        if (new Date(settings.currentTimestamp) > new Date(transmitter_data.maxTimestamp) ) {
            settings.filteredDataPoints[transmitter_id].currentGeoPointIndex = transmitter_data.geoPoints.length-1;
            continue;
        }

        if (new Date(oldTimestamp) > new Date(settings.currentTimestamp)) {     //timeline went back
            for (let i = settings.filteredDataPoints[transmitter_id].currentGeoPointIndex; i >= 0; i--) {
                if (new Date(transmitter_data.geoPoints[i].timestamp) < new Date(settings.currentTimestamp)) {
                    settings.filteredDataPoints[transmitter_id].currentGeoPointIndex = i;
                    placeMarker(transmitter_id, transmitter_data);
                    break;
                }
            }
        } else {        //timeline went forward
            for (let i = settings.filteredDataPoints[transmitter_id].currentGeoPointIndex; i < settings.filteredDataPoints[transmitter_id].geoPoints.length; i++) {
                if (new Date(transmitter_data.geoPoints[i].timestamp) > new Date(settings.currentTimestamp)) {
                    settings.filteredDataPoints[transmitter_id].currentGeoPointIndex = i;
                    placeMarker(transmitter_id, transmitter_data);
                    break;
                }
            }
        }
    }
}

//place just one marker
function placeMarker(transmitter_id, transmitter_data) {

    let incrementedDate = addtoDate(transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].timestamp, settings.timelineTimeOffset);
    let decreasedDate = addtoDate(transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].timestamp, -settings.timelineTimeOffset);

    //if transmitter is outside timeline range
    if (new Date(incrementedDate) < new Date(settings.currentTimestamp) || new Date(decreasedDate) > new Date(settings.currentTimestamp)) {
        return;
    }

    let enlargedRadius = false;
    for (const [transmitter_id_inner, transmitter_data_inner] of Object.entries(settings.filteredDataPoints)) {

        if (transmitter_id_inner === transmitter_id) {
            break;
        }

        if (transmitter_data_inner.marker != null && L.latLng(transmitter_data_inner.geoPoints[transmitter_data_inner.currentGeoPointIndex].lat, transmitter_data_inner.geoPoints[transmitter_data_inner.currentGeoPointIndex].lon)
            .equals(L.latLng(transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].lat, transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].lon)/*,number*/)) { //can use number to give a small error margin
            let popup = transmitter_data_inner.marker.getPopup().getContent();
            let newPopup = buildPopup(popup, transmitter_id, transmitter_data);

            transmitter_data_inner.marker.setPopupContent(newPopup);
            transmitter_data_inner.marker.setRadius(settings.largeRadius);
            transmitter_data_inner.marker.setStyle({color: settings.colorMultiple});
            enlargedRadius = true;
            break;
        }
    }

    if (enlargedRadius) {
        return;
    }

    let marker = L.circleMarker(
        [transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].lat, transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].lon],
        {radius: settings.smallRadius, color: getTransmitterColor(transmitter_data.species)}
    ).addTo(settings.map);

    let popup = "<div style='width: 150px'><p><b>" + transmitter_data.species + "</b> (" + transmitter_data.length + " cm) </p>";
    popup += "<p>Tag ID: " + transmitter_id.split("-")[2] + "</p>";
    popup += "<p>" + parseInt(transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].temperature) + " ºC - " + parseInt(transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].flow)  + " m&#179;/s</p>";
    marker.bindPopup(popup, {maxHeight: 200, maxWidth: 400});

    transmitter_data.marker = marker;
}

function placeMarkers() {
    for (const [transmitter_id, transmitter_data] of Object.entries(settings.filteredDataPoints)) {

        deleteMarker(transmitter_id, transmitter_data);

        let incrementedDate = addtoDate(transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].timestamp, settings.timelineTimeOffset);
        let decreasedDate = addtoDate(transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].timestamp, -settings.timelineTimeOffset);

        //if transmitter is outside timeline range
        if (new Date(incrementedDate) < new Date(settings.currentTimestamp) || new Date(decreasedDate) > new Date(settings.currentTimestamp)) {
            continue;
        }

        let enlargedRadius = false;
        for (const [transmitter_id_inner, transmitter_data_inner] of Object.entries(settings.filteredDataPoints)) {
            if (transmitter_id_inner === transmitter_id) {
                break;
            }

            if (transmitter_data_inner.marker != null && L.latLng(transmitter_data_inner.geoPoints[transmitter_data_inner.currentGeoPointIndex].lat, transmitter_data_inner.geoPoints[transmitter_data_inner.currentGeoPointIndex].lon)
                .equals(L.latLng(transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].lat, transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].lon)/*,number*/)) { //can use number to give a small error margin
                let popup = transmitter_data_inner.marker.getPopup().getContent();
                let newPopup = buildPopup(popup, transmitter_id, transmitter_data);

                transmitter_data_inner.marker.setPopupContent(newPopup);
                transmitter_data_inner.marker.setRadius(settings.largeRadius);
                transmitter_data_inner.marker.setStyle({color: settings.colorMultiple});
                enlargedRadius = true;
                break;
            }
        }

        if (enlargedRadius) {
            continue;
        }

        if (transmitter_data.marker == null){
            let marker = L.circleMarker(
                [transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].lat, transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].lon],
                {radius: settings.smallRadius, color: getTransmitterColor(transmitter_data.species)}
                ).addTo(settings.map);

            let popup = "<p><b>" + transmitter_data.species + "</b> (" + transmitter_data.length + " cm) </p>";
            popup += "<p>Tag ID: " + transmitter_id.split("-")[2] + "</p>";
            popup += "<p>" + parseInt(transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].temperature) + " ºC - " + parseInt(transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].flow) + " m&#179;/s</p>";
            marker.bindPopup(popup, {maxHeight: 200});

            transmitter_data.marker = marker;

        } else {
            var latlng = L.latLng(transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].lat, transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].lon);
            transmitter_data.marker.setLatLng(latlng);
        }
    }
}

function playAnimation() {
    advanceTime();

    for (const [transmitter_id, transmitter_data] of Object.entries(settings.filteredDataPoints)) {
        //if (transmitter_id === "A69-1602-26317") {
            if (new Date(transmitter_data.maxTimestamp) > new Date(settings.currentTimestamp) &&
                new Date(transmitter_data.minTimestamp) < new Date(settings.currentTimestamp)) {
                playAnimationAux(transmitter_id, transmitter_data);
                continue;
            } else {
                deleteMarker(transmitter_id, transmitter_data);
            }

            beginDelayedAnimation(transmitter_id, transmitter_data)
       // }
    }
}

function beginDelayedAnimation(transmitter_id, transmitter_data) {
    if (settings.playingAnimation && transmitter_id in settings.filteredDataPoints) {
        if (new Date(transmitter_data.maxTimestamp) > new Date(settings.currentTimestamp) &&
            new Date(transmitter_data.minTimestamp) < new Date(settings.currentTimestamp) &&
            transmitter_data.geoPoints.length <= transmitter_data.currentGeoPointIndex+1) {

            let dateForward = addtoDate(transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex+1].timestamp, settings.timelineTimeOffset);
            let dateBackwards = addtoDate(transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex+1].timestamp, -settings.timelineTimeOffset);

            if (new Date(dateForward) > new Date(settings.currentTimestamp) && new Date(dateBackwards) < new Date(settings.currentTimestamp)) {
                playAnimationAux(transmitter_id, transmitter_data);
                return;
            }
        }

        setTimeout(function(){
            beginDelayedAnimation(transmitter_id, transmitter_data);
        }, settings.timeFactor * 1000);
    }
}

function playAnimationAux(transmitter_id, transmitter_data) {

    if (transmitter_data.geoPoints.length <= transmitter_data.currentGeoPointIndex+1) {
        //reached end
        if (transmitter_data.marker != null) {
            transmitter_data.marker.remove();
            transmitter_data.marker = null;
        }
        return;
    }

    let dateForward = addtoDate(transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].timestamp, settings.timelineTimeOffset);
    let dateBackwards = addtoDate(transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].timestamp, -settings.timelineTimeOffset);

    if (new Date(dateForward) < new Date(settings.currentTimestamp) || new Date(dateBackwards) > new Date(settings.currentTimestamp)) {
        deleteMarker(transmitter_id, transmitter_data);
        beginDelayedAnimation(transmitter_id, transmitter_data);
        return;
    }

    if (settings.playingAnimation && transmitter_id in settings.filteredDataPoints) {

        //remove current marker
        deleteMarker(transmitter_id, transmitter_data);

        //if there is more than one point per day, divide the number of points per one day
        if (transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].ntimes > 1) {
            playAnimationHours(transmitter_id, transmitter_data);
            return;
        }

        let diffDays = dateDiffInDays(new Date(transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].timestamp),
            new Date(transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex+1].timestamp));

        let speed = diffDays * settings.timeFactor;

        let fishIcon = getFishIcon(transmitter_data.species);

        transmitter_data.marker = L.Marker.movingMarker([transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex], transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex+1]],
            speed * 1000,
            {icon:fishIcon}
        ).addTo(settings.map);

        transmitter_data.marker.start();

        setTimeout(function(){
            transmitter_data.currentGeoPointIndex++;
            if (transmitter_data.currentGeoPointIndex >= transmitter_data.geoPoints.length) {
                transmitter_data.currentGeoPointIndex = transmitter_data.geoPoints.length - 1;
            }

            playAnimationAux(transmitter_id, transmitter_data);
        }, speed * 1000);
    }
}

function playAnimationHours(transmitter_id, transmitter_data) {
    //add transition from last subpoint to next point
    let latlngs = transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].times;
    latlngs.push({
        "lat": transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex+1].lat,
        "lon": transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex+1].lon,
    });

    let diffDays = dateDiffInDays(new Date(transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].timestamp),
        new Date(transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex+1].timestamp));

    if (diffDays > settings.timelineTimeOffset) {
        deleteMarker(transmitter_id, transmitter_data);
        beginDelayedAnimation(transmitter_id, transmitter_data);
        return;
    }

    let fishIcon = getFishIcon(transmitter_data.species);

    //moving marker automatically calculates difference between each point and divides them in the time span set in the duration field
    transmitter_data.marker = L.Marker.movingMarker(latlngs,
        1000 * settings.timeFactor * diffDays,
        {icon:fishIcon}
    ).addTo(settings.map);
    transmitter_data.marker.start();

    setTimeout(function(){
        transmitter_data.currentGeoPointIndex++;
        if (transmitter_data.currentGeoPointIndex >= transmitter_data.geoPoints.length) {
            transmitter_data.currentGeoPointIndex = transmitter_data.geoPoints.length - 1;
        }
        playAnimationAux(transmitter_id, transmitter_data);
    }, 1000 * settings.timeFactor * diffDays);
}

/**
 * Advances the timeline slider with the speed defined in settings.timeFactor
 */
function advanceTime() {

    setTimeout(function(){
        if (settings.playingAnimation) {
            let currentDate = addtoDate(settings.currentTimestamp, 1);
            settings.currentTimestamp = currentDate.toISOString().split("T")[0];

            let slider = document.getElementById('noui-slider');
            slider.noUiSlider.set([null, currentDate.getTime(), null]);

            advanceTime();
        }
    }, settings.timeFactor * 1000);
}

/**
 * Stops all the animations
 */
function stopAllAnimations() {
    settings.playingAnimation = false;
    $(settings.selectors.btnPlay).html("Play");

    for (const [transmitter_id, transmitter_data] of Object.entries(settings.filteredDataPoints)) {
        if (new Date(transmitter_data.maxTimestamp) > new Date(settings.currentTimestamp) &&
            new Date(transmitter_data.minTimestamp) < new Date(settings.currentTimestamp) &&
            transmitter_data.currentGeoPointIndex > 0) {
            transmitter_data.currentGeoPointIndex--;
        }

        deleteMarker(transmitter_id, transmitter_data);
    }

    placeMarkers();
}

/**
 * Calculates the difference between two dates. Parameters must be of type Date
 *
 * @param a Date
 * @param b Date
 * @returns {number}
 */
function dateDiffInDays(a, b) {
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

    return Math.floor((utc2 - utc1) / settings.MS_PER_DAY);
}

/**
 * Adds a number of days to a given date
 *
 * @param date
 * @param days
 * @returns {Date}
 */
function addtoDate(date, days) {
    let result = new Date(date);
    result.setTime(result.getTime() + days * 24 * 3600 * 1000);
    return result;
}

/**
 * Initiates the temperature slider
 */
function createTemperatureSlider() {
    let slider = document.getElementById('noui-slider-temperature');

    noUiSlider.create(slider, {
        start: [0, 30],
        step: 1,
        connect: true,
        tooltips: [true, true],
        behaviour: 'drag',
        range: {
            'min': 0,
            'max': 30
        },
        format: {
            from: function(value) {
                return parseInt(value);
            },
            to: function(value) {
                return parseInt(value);
            }
        }
    });

    slider.noUiSlider.on('update', function( values, handle ) {
        //stop animations on click of any button
        if (settings.playingAnimation) {
            stopAllAnimations();
        }

        let minTemp = slider.noUiSlider.get()[0];
        let maxTemp = slider.noUiSlider.get()[1];

        settings.filters.minTemperature = minTemp;
        settings.filters.maxTemperature = maxTemp;
        applyFilters();
    });
}

/**
 * Initiates the flow slider
 */
function createFlowSlider() {
    let slider = document.getElementById('noui-slider-flow');

    noUiSlider.create(slider, {
        start: [0, 500],
        step: 1,
        connect: true,
        tooltips: [true, true],
        behaviour: 'drag',
        range: {
            'min': 0,
            'max': 500
        },
        format: {
            from: function(value) {
                return parseInt(value);
            },
            to: function(value) {
                return parseInt(value);
            }
        }
    });

    slider.noUiSlider.on('update', function( values, handle ) {
        //stop animations on click of any button
        if (settings.playingAnimation) {
            stopAllAnimations();
        }

        let minFlow = slider.noUiSlider.get()[0];
        let maxFlow = slider.noUiSlider.get()[1];

        settings.filters.minFlow = minFlow;
        settings.filters.maxFlow = maxFlow;
        applyFilters();
    });
}

/**
 * @param slider HtmlElement with an initialized slider
 * @param threshold Minimum proximity (in percentages) to merge tooltips
 * @param separator String joining tooltips
 */
function mergeTooltips(slider, threshold, separator) {

    var textIsRtl = getComputedStyle(slider).direction === 'rtl';
    var isRtl = slider.noUiSlider.options.direction === 'rtl';
    var isVertical = slider.noUiSlider.options.orientation === 'vertical';
    var tooltips = slider.noUiSlider.getTooltips();
    var origins = slider.noUiSlider.getOrigins();

    // Move tooltips into the origin element. The default stylesheet handles this.
    tooltips.forEach(function (tooltip, index) {
        if (tooltip) {
            origins[index].appendChild(tooltip);
        }
    });

    slider.noUiSlider.on('update', function (values, handle, unencoded, tap, positions) {

        var pools = [[]];
        var poolPositions = [[]];
        var poolValues = [[]];
        var atPool = 0;

        // Assign the first tooltip to the first pool, if the tooltip is configured
        if (tooltips[0]) {
            pools[0][0] = 0;
            poolPositions[0][0] = positions[0];
            poolValues[0][0] = values[0];
        }

        for (var i = 1; i < positions.length; i++) {
            if (!tooltips[i] || (positions[i] - positions[i - 1]) > threshold) {
                atPool++;
                pools[atPool] = [];
                poolValues[atPool] = [];
                poolPositions[atPool] = [];
            }

            if (tooltips[i]) {
                pools[atPool].push(i);
                poolValues[atPool].push(values[i]);
                poolPositions[atPool].push(positions[i]);
            }
        }

        pools.forEach(function (pool, poolIndex) {
            var handlesInPool = pool.length;

            for (var j = 0; j < handlesInPool; j++) {
                var handleNumber = pool[j];

                if (j === handlesInPool - 1) {
                    var offset = 0;

                    poolPositions[poolIndex].forEach(function (value) {
                        offset += 1000 - 10 * value;
                    });

                    var direction = isVertical ? 'bottom' : 'right';
                    var last = isRtl ? 0 : handlesInPool - 1;
                    var lastOffset = 1000 - 10 * poolPositions[poolIndex][last];
                    offset = (textIsRtl && !isVertical ? 100 : 0) + (offset / handlesInPool) - lastOffset;

                    // Center this tooltip over the affected handles
                    tooltips[handleNumber].innerHTML = poolValues[poolIndex].join(separator);
                    tooltips[handleNumber].style.display = 'block';
                    tooltips[handleNumber].style[direction] = offset + '%';
                } else {
                    // Hide this tooltip
                    tooltips[handleNumber].style.display = 'none';
                }
            }
        });
    });
}

/**
 * Gets the fish color based on species
 *
 * @param species
 * @returns {string}
 */
function getTransmitterColor(species) {
    switch (species) {
        case "Pike":
            return settings.colorPike;
        case "Sea lamprey":
            return settings.colorSeaLamprey;
        case "Barbel":
            return settings.colorBarbel;
        case "Zander":
            return settings.colorZander;
        case "Twaite shad":
            return settings.colorShad;
    }
}

/**
 * Delets a single marker
 *
 * @param transmitter_id
 * @param transmitter_data
 */
function deleteMarker(transmitter_id, transmitter_data) {
    if (transmitter_data.marker != null) {
        if (transmitter_data.marker instanceof L.Marker.MovingMarker) {
            transmitter_data.marker.stop();
        }
        transmitter_data.marker.remove();
        transmitter_data.marker = null;
    }
}

/**
 * Removes all markers from the filtered points
 */
function eraseAllMarkers() {
    for (const [transmitter_id, transmitter_data] of Object.entries(settings.filteredDataPoints)) {
        deleteMarker(transmitter_id, transmitter_data);
    }
}

/**
 * Gets to icon corresponding to the fish species
 *
 * @param species
 * @returns {null}
 */
function getFishIcon(species) {
    switch (species) {
        case "Pike":
            return settings.iconPike;
        case "Sea lamprey":
            return settings.iconSeaLamprey;
        case "Barbel":
            return settings.iconBarbel;
        case "Zander":
            return settings.iconZander;
        case "Twaite shad":
            return settings.iconShad;
    }
}

/**
 * Adds content to the marker popup
 *
 * @param currentContent
 * @param transmitter_id
 * @param transmitter_data
 * @returns new popup content formatted string
 */
function buildPopup(currentContent, transmitter_id, transmitter_data) {
    let index = currentContent.lastIndexOf('<p>');
    let popup = currentContent.slice(0, index);
    let commonContent = currentContent.slice(index);

    popup += "<p>--------------------------</p>"
    popup += "<p><b>" + transmitter_data.species + "</b> (" + transmitter_data.length + " cm) </p>";
    popup += "<p>Tag ID: " + transmitter_id.split("-")[2] + "</p>";
    popup += commonContent;

    return popup;
}

/**
 * Places all static weir markers on the map. Powick weir has a different icon
 */
function placeWeirMarkers() {
    let powick_icon = L.icon({
        iconUrl: 'media/icon_powick_weir.svg',
        iconSize: [20, 20]
    });

    let powickWeirMarker = L.marker(settings.weirGeoPoint, {icon:powick_icon}).addTo(settings.map);
    powickWeirMarker.bindPopup("<p style='text-align: center'><b>Powick weir</b></p>");

    let maisemoreWeirMarker = L.marker([51.89318, -2.26574]).addTo(settings.map);
    maisemoreWeirMarker.bindPopup("<p style='text-align: center'><b>Maisemore weir</b></p>");

    let llanthonyWeirMarker = L.marker([51.86227, -2.26028]).addTo(settings.map);
    llanthonyWeirMarker.bindPopup("<p style='text-align: center'><b>Llanthony weir</b></p>");

    let upperLodeWeirMarker = L.marker([51.89318, -2.26574]).addTo(settings.map);
    upperLodeWeirMarker.bindPopup("<p style='text-align: center'><b>Upper Lode weir</b></p>");

    let diglisWeirMarker = L.marker([52.17926, -2.22597]).addTo(settings.map);
    diglisWeirMarker.bindPopup("<p style='text-align: center'><b>Diglis weir</b></p>");

    let bevereWeirMarker = L.marker([52.23256, -2.24027]).addTo(settings.map);
    bevereWeirMarker.bindPopup("<p style='text-align: center'><b>Bevere weir</b></p>");

    let holtWeirMarker = L.marker([52.26812, -2.26576]).addTo(settings.map);
    holtWeirMarker.bindPopup("<p style='text-align: center'><b>Holt weir</b></p>");

    let lincombWeirMarker = L.marker([52.32290, -2.26596]).addTo(settings.map);
    lincombWeirMarker.bindPopup("<p style='text-align: center'><b>Lincomb weir</b></p>");

    let knightwickWeirMarker = L.marker([52.19908, -2.38940]).addTo(settings.map);
    knightwickWeirMarker.bindPopup("<p style='text-align: center'><b>Knightwick weir</b></p>");

    let abbeyMillWeirMarker = L.marker([51.99133, -2.16325]).addTo(settings.map);
    abbeyMillWeirMarker.bindPopup("<p style='text-align: center'><b>Abbey Mill weir</b></p>");

    let stanchardsPitWeirMarker = L.marker([51.99837, -2.15561]).addTo(settings.map);
    stanchardsPitWeirMarker.bindPopup("<p style='text-align: center'><b>Stanchards Pit weir</b></p>");
}

function getMovingMarkerIcon(current_icon, mirrored) {
    let intermediate = current_icon.split("_");
    intermediate = intermediate[intermediate.length-1];
    let species = intermediate.split(".")[0];

    let iconURL = "";

    switch (species) {
        case "shad":
            if (mirrored) {
                iconURL = "media/icon_mirror_shad.png";
            } else {
                iconURL = "media/icon_shad.png";
            }
            break;
        case "pike":
            if (mirrored) {
                iconURL = "media/icon_mirror_pike.png";
            } else {
                iconURL = "media/icon_pike.png";
            }
            break;
        case "zander":
            if (mirrored) {
                iconURL = "media/icon_mirror_zander.png";
            } else {
                iconURL = "media/icon_zander.png";
            }
            break;
        case "barbel":
            if (mirrored) {
                iconURL = "media/icon_mirror_barbel.png";
            } else {
                iconURL = "media/icon_barbel.png";
            }
            break;
        case "lamprey":
            if (mirrored) {
                iconURL = "media/icon_mirror_lamprey.png";
            } else {
                iconURL = "media/icon_lamprey.png";
            }
            break;
    }

    let icon = L.icon({
        iconUrl: iconURL,
        iconSize: [40, 20],
        iconAnchor: [20, 10],
        popupAnchor: [20, 10]
    });
    return icon;
}

/**
 * Moves the filters to be under the timeline in small screens
 */
function resizeFilters() {
    if ( $(window).width() < 767) {
        $(settings.selectors.filters).children().appendTo(".mobile-filters");
    }
    else {
        $(settings.selectors.mobileFilters).children().appendTo(".filters");
    }
}

behaviours.init();
behaviours.initEvents();
