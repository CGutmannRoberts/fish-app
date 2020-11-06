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
        valueFlow: '#value-flow'
    },

    geoPoints: [
        [51.5097, -0.1124],
        [51.5096, -0.1042],
        [51.5093, -0.0967],
        [51.5076, -0.0879],
        [51.5077, -0.0798]
    ],

    dataPoints: [],
    filteredDataPoints: [],

    filters: {
        fishSpecies: [true, true, true, true],
        minTemperature: 10,
        maxTemperature: 25,
        minFlow: 25,
        maxFlow: 75,
        beforeWeir: true,
        afterWeir: true,
    },

    map: null,
    centerGeoPoint: [52.1704, -2.242],
    currentIndex: 0,
    currentMarker: null,
    smallRadius: 5,
    largeRadius: 10,
    currentTimestamp: "2015-09-25 00:00:00",
    currentTimeIncrement: 5,
    timelineTimeOffset: 30,
    markerPlaySpeed: 200,
    playingAnimation: false,
    timeFactor: 1, //if this is 1, 1 sec = 1 day; if this is 2, 2 sec = 1 day

    relativeMinTime: "9999-01-01 00:00:00",
    relativeMaxTime: "0000-01-01 00:00:00",
    absoluteMinTime: "9999-01-01 00:00:00",
    absoluteMaxTime: "0000-01-01 00:00:00",

    fishIcon: null,
    weirDate: "2018-09-21",

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
        //var polyline = L.polyline(settings.geoPoints, {color: 'red'}).addTo(settings.map);

        $(settings.selectors.sliderTimeline).attr('max', settings.geoPoints.length-1);

        settings.fishIcon = L.icon({
            iconUrl: 'data/fish1_20x20.png',
            iconAnchor: [10, 10],
            popupAnchor: [10, 10]
        });

        //transformJSON();
        getJSONData();
        createTemperatureSlider();
        createFlowSlider();
    },
    initEvents: function () {
        $(settings.selectors.btnForwards).on('click', function () {
            let currentDate = new Date(settings.currentTimestamp);
            currentDate.setDate(currentDate.getDate() + settings.currentTimeIncrement);

            if (currentDate > new Date(settings.relativeMaxTime)) {
                console.log("Reached max");
                currentDate = new Date(settings.relativeMaxTime);
            }

            settings.currentTimestamp = currentDate.toISOString().split("T")[0];
            let slider = document.getElementById('noui-slider');
            slider.noUiSlider.set([null, currentDate.getTime(), null]);

            console.log("Clicking forwards. Current timetamp: " + settings.currentTimestamp);
        });

        $(settings.selectors.btnBackwards).on('click', function () {
            let currentDate = new Date(settings.currentTimestamp);
            currentDate.setDate(currentDate.getDate() - settings.currentTimeIncrement);

            if (currentDate < new Date(settings.relativeMinTime)) {
                console.log("Reached min");
                currentDate = new Date(settings.relativeMinTime);
            }

            settings.currentTimestamp = currentDate.toISOString().split("T")[0];
            let slider = document.getElementById('noui-slider');
            slider.noUiSlider.set([null, currentDate.getTime(), null]);

            console.log("Clicking backwards. Current timetamp: " + settings.currentTimestamp);
        });

        $(settings.selectors.btnPlay).on('click', function () {
            /*settings.dataPoints[settings.currentIndex].marker.setRadius(settings.smallRadius);

            //var myMovingMarker = L.Marker.movingMarker(settings.geoPoints, [2000, 2000, 2000, 2000, 2000]).addTo(settings.map);
            settings.currentMarker = L.Marker.movingMarker(settings.geoPoints, 5000).addTo(settings.map);
            settings.currentMarker.start();*/
            settings.playingAnimation = !settings.playingAnimation;
            if (settings.playingAnimation) {
                $(this).html("Stop");
                console.log("Playing!");
                playAnimation();
            } else {
                console.log("Stopping!");
                $(this).html("Play");
                stopAllAnimations();
            }



        });

        settings.map.on('zoomstart', function() {
            if (settings.currentMarker){
                settings.currentMarker.pause();
            }
        });

        settings.map.on('zoomend', function() {
            if (settings.currentMarker){
                settings.currentMarker.start();
            }
        });

        //settings.map.on('moveend', placeMarkersInBounds);


        /*$(settings.selectors.chkWeirBefore).on('change', function () {
            //togglePointsByWeir("before", this.checked);
            settings.filters.beforeWeir = this.checked;
            applyFilters();
        });

        $(settings.selectors.chkWeirAfter).on('change', function () {
            //togglePointsByWeir("after", this.checked);
            settings.filters.afterWeir = this.checked;
            applyFilters();
        });*/

        /*$(settings.selectors.sliderTemperature).slider({
            range: true,
            min: 0,
            max: 30,
            values: [ 10, 25 ],
            slide: function( event, ui ) {
                $(settings.selectors.valueTemperature).val( + ui.values[ 0 ] + " - " + ui.values[ 1 ]);
                settings.filters.minTemperature = ui.values[0];
                settings.filters.maxTemperature = ui.values[1];
                applyFilters();
            }
        });
        $(settings.selectors.valueTemperature).val($(settings.selectors.sliderTemperature).slider("values", 0) +
            " - " + $(settings.selectors.sliderTemperature).slider("values", 1));

        $(settings.selectors.sliderFlow).slider({
            range: true,
            min: 0,
            max: 100,
            values: [ 25, 75 ],
            slide: function( event, ui ) {
                $(settings.selectors.valueFlow).val( + ui.values[0] + " - " + ui.values[1]);
                settings.filters.minFlow = ui.values[0];
                settings.filters.maxFlow = ui.values[1];
                applyFilters();
            }
        });
        $(settings.selectors.valueFlow).val($(settings.selectors.sliderFlow).slider("values", 0) +
            " - " + $(settings.selectors.sliderFlow).slider("values", 1));*/


        let species = document.getElementsByClassName('checkbox-species');

        for (let i=0; i < species.length; i++) {
            species[i].onclick = function(){
                settings.filters.fishSpecies[i] = species[i].checked;
                applyFilters();
            }
        }
    }
};

function transformJSON() {
    //$.getJSON( "data/barbel.json", function( data ) {
        $.getJSON( "data/all_data.json", function( data ) {
        console.log("JSON being saved");

        let allPoints = {};
        let minTimestamp = "2020-01-01 00:00:00";
        let maxTimestamp = "0000-01-01 00:00:00";


        $.each( data, function( key, val ) {
            //TODO: Configure marker here (color, size, etc)
            let dateObj = new Date(val.Timestamp);
            let date = dateObj.getFullYear() + "-" + (dateObj.getMonth()+1) + "-" + dateObj.getDate();

            if (val.Transmitter in allPoints) {
                if (new Date(date).valueOf() < new Date(allPoints[val.Transmitter].minTimestamp).valueOf()) {
                    allPoints[val.Transmitter].minTimestamp = date;
                }

                if (new Date(date).valueOf() > new Date(allPoints[val.Transmitter].maxTimestamp).valueOf()) {
                    allPoints[val.Transmitter].maxTimestamp = date;
                }


                let found = false;
                $.each( allPoints[val.Transmitter].geoPoints, function( key2, val2 ) {
                    if (date == val2.timestamp) {
                        val2.times.push({
                            lat: val.Latitude,
                            lon: val.Longitude,
                            timestamp: val.Timestamp,
                            flow: val.flow,
                            temperature: val.Temp
                        });
                        val2.ntimes = val2.times.length;
                        found = true;
                    }
                    //console.log(key);
                    //console.log(val);
                });


                if (!found) {
                    allPoints[val.Transmitter].geoPoints.push({
                        lat: val.Latitude,
                        lon: val.Longitude,
                        timestamp: date,
                        ntimes: 1,
                        times: [{
                            lat: val.Latitude,
                            lon: val.Longitude,
                            timestamp: val.Timestamp
                        }]
                    });
                }

            } else {
                //if (val.Transmitter !== "A69-1601-38508" && val.Transmitter !== "A69-1601-38509")
                //    return;

                let newTransmitter = {
                    minTimestamp: date,
                    maxTimestamp: date,
                    species: val.Species,
                    markerColor: "#006300",
                    currentGeoPointIndex: 0,
                    geoPoints: []
                };

                newTransmitter.geoPoints.push({
                    lat: val.Latitude,
                    lon: val.Longitude,
                    timestamp: date,
                    ntimes: 1,
                    times: [{
                        lat: val.Latitude,
                        lon: val.Longitude,
                        timestamp: val.Timestamp
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
                headers: {
                    "Content-Length": 41943091,
                },
                url: 'http://localhost/Fish-Tracking App/save_json.php',
                data: { data: newjson}
            }).fail(function(request, status, exception) {
                console.log(exception);
            })
                .always(function() { alert("complete post"); });


    })
            .fail(function() { alert("error"); })
            .always(function() { alert("complete"); });
}

function applyFilters(){
    settings.filteredDataPoints = {};

    $.each( settings.dataPoints, function( key, val ) {
        if (settings.filters.fishSpecies[0] && val.species === "Barbel") {
            settings.filteredDataPoints[key] = val;
        }

        if (settings.filters.fishSpecies[1] && val.species === "Sea Lamprey") {
            settings.filteredDataPoints[key] = val;
        }

        if (settings.filters.fishSpecies[2] && val.species === "Pike") {
            settings.filteredDataPoints[key] = val;
        }

        if (settings.filters.fishSpecies[3] && val.species === "Twaite Shad") {
            settings.filteredDataPoints[key] = val;
        }

        if (settings.filters.fishSpecies[4] && val.species === "Zander") {
            settings.filteredDataPoints[key] = val;
        }


    });

    findRelativeMinMax();
}

function processArray(items, process) {
    var todo = items.concat();

    var i=0;
    setTimeout(function() {
        process(todo.shift());

        if(todo.length > 0) {
            setTimeout(arguments.callee, 5);
        }
    }, 5);
}

function getJSONData(){
    $.getJSON( "data/saved.json", function( data ) {
    //$.getJSON( "data/barbel.json", function( data ) {
    //$.getJSON( "data/all_data.json", function( data ) {
        console.log("JSON loaded with success");
        var i = 0;

        let allPoints = {};
        let minTimestamp = "2020-01-01 00:00:00";
        let maxTimestamp = "0000-01-01 00:00:00";


        $.each( data, function( key, val ) {

            if (new Date(val.minTimestamp) < new Date(settings.absoluteMinTime)){
                settings.absoluteMinTime = val.minTimestamp;
            }

            if (new Date(val.maxTimestamp) > new Date(settings.absoluteMaxTime)){
                settings.absoluteMaxTime = val.maxTimestamp;
            }

            //destruct obj
            dateObj = null;
        });

        settings.dataPoints = data;
        settings.filteredDataPoints = settings.dataPoints;

        console.log("Loaded " + Object.keys(allPoints).length + " transmitters");
        console.log("Absolute min time: " + settings.absoluteMinTime);
        console.log("Absolute max time: " + settings.absoluteMaxTime);



        findRelativeMinMax();
        findFirstTimeMarkers();
        //findCurrentTimeMarkers(settings.currentTimestamp);
    });
}

function findRelativeMinMax() {
    settings.relativeMinTime = "9999-01-01 00:00:00";
    settings.relativeMaxTime = "0000-01-01 00:00:00";

    $.each( settings.filteredDataPoints, function( key, val ) {
        if (new Date(val.minTimestamp) < new Date(settings.relativeMinTime)) {
            settings.relativeMinTime = val.minTimestamp;
        }

        if (new Date(val.maxTimestamp) > new Date(settings.relativeMaxTime)) {
            settings.relativeMaxTime = val.maxTimestamp;
        }
    });

    console.log("Relative min time: " + settings.relativeMinTime);
    console.log("Relative max time: " + settings.relativeMaxTime);

    buildTimelineSlider();
}

function buildTimelineSlider() {
    let slider = document.getElementById('noui-slider');
    let origins = slider.getElementsByClassName('noUi-origin');

    if (slider.noUiSlider) {
        console.log("setting");
        //origins[0].setAttribute('disabled', false);
        //origins[2].setAttribute('disabled', false);
        slider.noUiSlider.set([new Date(settings.relativeMinTime).getTime(), null, new Date(settings.relativeMaxTime).getTime()]);
    } else {
        console.log("creating");
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
                    //let date_string = ("0" + d.getDate()).slice(-2) + '/' + ("0" + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear()
                    let date_string = d.getFullYear() + '/' + ("0" + (d.getMonth() + 1)).slice(-2) + '/' + ("0" + d.getDate()).slice(-2);
                    return date_string;
                },
                // 'from' the formatted value.
                // Receives a string, should return a number.
                from: function (value) {
                    //console.log("from value: " + value)
                    return Number(value.replace(',-', ''));
                }
            }
        });

        slider.noUiSlider.on('update', function( values, handle ) {
            /*let timestamp = slider.noUiSlider.get()[1];

            if (timestamp !== settings.currentTimestamp) {
                console.log("setting timestamp!");
                let oldTimestamp = settings.currentTimestamp;
                settings.currentTimestamp = new Date(timestamp).toISOString().split("T")[0];
                findCurrentTimeMarkers(oldTimestamp);
            }*/
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

        mergeTooltips(slider, 15, ' - ');
    }
}

function setCurrentTimestamp(newTimestamp) {
    if (currentDate > new Date(settings.relativeMaxTime)) {
        console.log("Reached max");
        currentDate = new Date(settings.relativeMaxTime);
    }
}

function findFirstTimeMarkers() {
    for (const [transmitter_id, transmitter_data] of Object.entries(settings.filteredDataPoints)) {
        let found = false;
        transmitter_data.geoPoints.forEach(function (item, index) {
            if (!found && new Date(item.timestamp) > new Date(settings.currentTimestamp)) {
                settings.filteredDataPoints[transmitter_id].currentGeoPointIndex = index;
                found = true;
                return;
            }

        });
        console.log(transmitter_data);
    }

    placeMarkers();
}

function findCurrentTimeMarkers(oldTimestamp) {

    for (const [transmitter_id, transmitter_data] of Object.entries(settings.filteredDataPoints)) {
        let found = false;

        let incrementedDate = new Date(
            new Date(transmitter_data.maxTimestamp).getFullYear(),
            new Date().getMonth(),
            new Date().getDate() + settings.timelineTimeOffset
        );

        let decreasedDate = new Date(
            new Date(transmitter_data.maxTimestamp).getFullYear(),
            new Date().getMonth(),
            new Date().getDate() + settings.timelineTimeOffset
        );

        if (transmitter_data.marker != null && (new Date(settings.currentTimestamp) > incrementedDate || new Date(settings.currentTimestamp) < decreasedDate)) {
            transmitter_data.marker.remove();
            transmitter_data.marker = null;
            continue;
        }

        if (new Date(oldTimestamp) > new Date(settings.currentTimestamp)) {     //timeline went back
            console.log("Previous index = " + settings.filteredDataPoints[transmitter_id].currentGeoPointIndex + " at timestamp = " + settings.currentTimestamp);
            for (let i = settings.filteredDataPoints[transmitter_id].currentGeoPointIndex; i >= 0; i--) {
                if (!found && new Date(transmitter_data.geoPoints[i].timestamp) < new Date(settings.currentTimestamp)) {
                    settings.filteredDataPoints[transmitter_id].currentGeoPointIndex = i;
                    found = true;
                    console.log("Found index = " + i + " at timestamp = " + transmitter_data.geoPoints[i].timestamp);
                    placeMarker(transmitter_id, transmitter_data);
                    break;
                }
            }
        } else {        //timeline went forward
            for (let i = settings.filteredDataPoints[transmitter_id].currentGeoPointIndex; i < settings.filteredDataPoints[transmitter_id].geoPoints.length; i++) {
                if (!found && new Date(transmitter_data.geoPoints[i].timestamp) > new Date(settings.currentTimestamp)) {
                    settings.filteredDataPoints[transmitter_id].currentGeoPointIndex = i;
                    found = true;
                    console.log("Found index = " + i + " at timestamp = " + transmitter_data.geoPoints[i].timestamp);
                    placeMarker(transmitter_id, transmitter_data);
                    break;
                }
            }
        }
    }

    console.log("Finding time markers");
    console.log(settings.filteredDataPoints);

    //placeMarkers();
}

//place just one marker
function placeMarker(transmitter_id, transmitter_data) {
    
    if (transmitter_data.marker != null) {
        if (transmitter_data.marker instanceof L.Marker.MovingMarker) {
            transmitter_data.marker.stop();
        }
        transmitter_data.marker.remove();
        transmitter_data.marker = null;
    }

    if (transmitter_data.currentGeoPointIndex === 0 ) {
        return;
    }

    if (transmitter_data.currentGeoPointIndex >= transmitter_data.geoPoints.length-1) {
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
            popup += "<p>--------------------------</p>"
            popup += "<p><b>" + transmitter_data.species + "</b></p>";
            // popup += "<p>Lat: " + val.Latitude + " | Lon: " + val.Longitude + "</p>";
            popup += "<p>Transmitter: " + transmitter_id.split("-")[2] + "</p>";
            popup += "<p>Temperature: 15º</p>";
            transmitter_data_inner.marker.setPopupContent(popup);

            transmitter_data_inner.marker.setRadius(settings.largeRadius);
            enlargedRadius = true;
            break;
        }
    }

    if (enlargedRadius) {
        console.log("enlarged!");
        return;
    }

    let marker = L.circleMarker(
        [transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].lat, transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].lon],
        {radius: settings.smallRadius, color: transmitter_data.markerColor}
    ).addTo(settings.map);

    let popup = "<div style='width: 150px'><p><b>" + transmitter_data.species + "</b></p>";
    //popup += "<p>Lat: " + val.Latitude + " | Lon: " + val.Longitude + "</p>";
    popup += "<p>Transmitter: " + transmitter_id.split("-")[2] + "</p>";
    popup += "<p>Temperature: 15º</p></div>";
    marker.bindPopup(popup, {maxHeight: 200, maxWidth: 400});

    transmitter_data.marker = marker;
}

function placeMarkers() {

    for (const [transmitter_id, transmitter_data] of Object.entries(settings.filteredDataPoints)) {

        if (transmitter_data.marker != null) {
            transmitter_data.marker.remove();
            transmitter_data.marker = null;
        }

        let enlargedRadius = false;
        for (const [transmitter_id_inner, transmitter_data_inner] of Object.entries(settings.filteredDataPoints)) {
            if (transmitter_id_inner === transmitter_id) {
                break;
            }

            if (L.latLng(transmitter_data_inner.geoPoints[transmitter_data_inner.currentGeoPointIndex].lat, transmitter_data_inner.geoPoints[transmitter_data_inner.currentGeoPointIndex].lon)
                .equals(L.latLng(transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].lat, transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].lon)/*,number*/)) { //can use number to give a small error margin
                let popup = transmitter_data_inner.marker.getPopup().getContent();
                popup += "<p>--------------------------</p>"
                popup += "<p><b>" + transmitter_data.species + "</b></p>";
                // popup += "<p>Lat: " + val.Latitude + " | Lon: " + val.Longitude + "</p>";
                popup += "<p>Transmitter: " + transmitter_id.split("-")[2] + "</p>";
                popup += "<p>Temperature: 15º</p>";
                transmitter_data_inner.marker.setPopupContent(popup);

                transmitter_data_inner.marker.setRadius(settings.largeRadius);
                enlargedRadius = true;
                break;
            }
        }


        if (enlargedRadius) {
            console.log("enlarged!");
            continue;
        }

        if (transmitter_data.marker == null){
            let marker = L.circleMarker(
                [transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].lat, transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].lon],
                {radius: /*found ? settings.largeRadius :*/ settings.smallRadius, color: transmitter_data.markerColor}
                ).addTo(settings.map);

            let popup = "<p><b>" + transmitter_data.species + "</b></p>";
            // popup += "<p>Lat: " + val.Latitude + " | Lon: " + val.Longitude + "</p>";
            popup += "<p>Transmitter: " + transmitter_id.split("-")[2] + "</p>";
            popup += "<p>Temperature: 15º</p>";
            marker.bindPopup(popup, {maxHeight: 200});

            transmitter_data.marker = marker;

        } else {
            var latlng = L.latLng(transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].lat, transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].lon);
            transmitter_data.marker.setLatLng(latlng);
        }


        //console.log("Drawing transmitter " + transmitter_id + " at (" + transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].lat + "," + transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].lon + ") at " + transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].timestamp);
    }

    console.log("aqui");
    //console.log(settings.filteredDataPoints);
}

function playAnimation() {

    advanceTime();
    console.log(settings.filteredDataPoints);

    for (const [transmitter_id, transmitter_data] of Object.entries(settings.filteredDataPoints)) {
        if (new Date(transmitter_data.maxTimestamp) > new Date(settings.currentTimestamp) &&
            new Date(transmitter_data.minTimestamp) < new Date(settings.currentTimestamp)) {
            playAnimationAux(transmitter_id, transmitter_data);
            continue;
        }

        beginDelayedAnimation(transmitter_id, transmitter_data)
    }
}

function beginDelayedAnimation(transmitter_id, transmitter_data) {
    if (settings.playingAnimation) {
        if (new Date(transmitter_data.maxTimestamp) > new Date(settings.currentTimestamp) &&
            new Date(transmitter_data.minTimestamp) < new Date(settings.currentTimestamp)) {
            console.log(transmitter_id + " now beginning animation after delay at " + settings.currentTimestamp);
            playAnimationAux(transmitter_id, transmitter_data);
            return;
        }

        setTimeout(function(){
            //console.log(transmitter_id + " delayed for another day, from " + settings.currentTimestamp);
            beginDelayedAnimation(transmitter_id, transmitter_data);
        }, settings.timeFactor * 1000);
    }
}

function playAnimationAux(transmitter_id, transmitter_data) {

    if (transmitter_data.geoPoints.length <= transmitter_data.currentGeoPointIndex+1) {
        //reached end
        transmitter_data.marker.remove();
        transmitter_data.marker = null;
        console.log(transmitter_id + " reaching end at " + settings.currentTimestamp);
        return;
    }

    if (settings.playingAnimation) {

        //remove current marker
        if (transmitter_data.marker != null) {
            transmitter_data.marker.remove();
            transmitter_data.marker = null;
        }

        //if there is more than one point per day, divide the number of points per one day
        if (transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].ntimes > 1) {
            playAnimationHours(transmitter_id, transmitter_data);
            return;
        }

        let diffDays = dateDiffInDays(new Date(transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].timestamp),
            new Date(transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex+1].timestamp));

        let speed = diffDays * settings.timeFactor;


        let fishIcon = L.icon({
            iconUrl: 'data/fish1_20x20.png',
            iconAnchor: [10, 10],
            popupAnchor: [10, 10]
        });

        transmitter_data.marker = L.Marker.movingMarker([transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex], transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex+1]],
            speed * 1000,
            {icon:fishIcon}
        ).addTo(settings.map);
        transmitter_data.marker.start();

        setTimeout(function(){
            transmitter_data.currentGeoPointIndex++;
            //console.log("from general incremented " + transmitter_id + " at " + settings.currentTimestamp);

            playAnimationAux(transmitter_id, transmitter_data);
        }, speed * 1000);
    }
}

function playAnimationHours(transmitter_id, transmitter_data) {

    let fishIcon = L.icon({
        iconUrl: 'data/fish1_20x20.png',
        iconAnchor: [10, 10],
        popupAnchor: [10, 10]
    });

    //add transition from last subpoint to next point
    let latlngs = transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].times;
    latlngs.push({
        "lat": transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex+1].lat,
        "lon": transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex+1].lon,
    });

    let diffDays = dateDiffInDays(new Date(transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].timestamp),
        new Date(transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex+1].timestamp));

    //moving marker automatically calculates difference between each point and divides them in the time span set in the duration field
    transmitter_data.marker = L.Marker.movingMarker(latlngs,
        1000 * settings.timeFactor * diffDays,
        {icon:fishIcon}
    ).addTo(settings.map);
    transmitter_data.marker.start();

    setTimeout(function(){
        transmitter_data.currentGeoPointIndex++;
        //console.log("from hours incremented " + transmitter_id + " at " + settings.currentTimestamp);
        playAnimationAux(transmitter_id, transmitter_data);
    }, 1000 * settings.timeFactor * diffDays);
}


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

function stopAllAnimations() {
    for (const [transmitter_id, transmitter_data] of Object.entries(settings.filteredDataPoints)) {

        if (new Date(transmitter_data.maxTimestamp) > new Date(settings.currentTimestamp) &&
            new Date(transmitter_data.minTimestamp) < new Date(settings.currentTimestamp) &&
            transmitter_data.currentGeoPointIndex > 0) {
            transmitter_data.currentGeoPointIndex--;
        }

        placeMarker(transmitter_id, transmitter_data);
        //place marker in current spot
        /*let marker = L.circleMarker(
            [transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].lat, transmitter_data.geoPoints[transmitter_data.currentGeoPointIndex].lon],
            {radius: settings.smallRadius, color: transmitter_data.markerColor}
        ).addTo(settings.map);

        let popup = "<p><b>" + transmitter_data.species + "</b></p>";
        // popup += "<p>Lat: " + val.Latitude + " | Lon: " + val.Longitude + "</p>";
        popup += "<p>Transmitter: " + transmitter_id.split("-")[2] + "</p>";
        popup += "<p>Temperature: 15º</p>";
        marker.bindPopup(popup, {maxHeight: 200});

        transmitter_data.marker = marker;

        transmitter_data.currentGeoPointIndex--;*/
    }
}

// a and b are javascript Date objects
function dateDiffInDays(a, b) {
    // Discard the time and time-zone information.
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

    return Math.floor((utc2 - utc1) / settings.MS_PER_DAY);
}

function addtoDate(date, days) {
    let result = new Date(date);
    result.setTime(result.getTime() + days * 24 * 3600 * 1000);
    return result;
}


function placeMarkersInBounds() {
    var mapBounds = settings.map.getBounds();
    var count = 0;
    for (var i = settings.dataPoints.length -1; i >= 0; i--) {
        var m = settings.dataPoints[i];
        var shouldBeVisible = mapBounds.contains(settings.dataPoints[i].getLatLng());
        if (!shouldBeVisible) {
            m.alreadyVisible = false;
            settings.map.removeLayer(m);
        } else if (!m.alreadyVisible && shouldBeVisible) {
            m.alreadyVisible = true;
            settings.map.addLayer(m);
            count++;
        }

        console.log("count = " + count);
        /*if (count > 1000){
            return;
        }*/
    }
}


function createTemperatureSlider() {
    let slider = document.getElementById('noui-slider-temperature');

    noUiSlider.create(slider, {
        start: [10, 20],
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
}

function createFlowSlider() {
    let slider = document.getElementById('noui-slider-flow');

    noUiSlider.create(slider, {
        start: [10, 20],
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

behaviours.init();
behaviours.initEvents();
