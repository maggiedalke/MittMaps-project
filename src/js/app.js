/* The purpose of this javascript file is to handle the functionality
 * of the map location based on the users location and their searches.
 * Authors Abhijeet, Creston, and Maggie
 */

// CONST
let longitude, latitude, marker, form, list, search, map;

// API CALLS
const getUserPosition = () => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition((position) => {
      if (position != undefined) {
        longitude = position.coords.longitude;
        latitude = position.coords.latitude;

        resolve('completed');
      } else {
        reject('could not get position');
      }
    });
  });
};

const getPOI = function (search) {
  return fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${search}.json?types=poi&proximity=${longitude}%2c${latitude}&limit=10&access_token=pk.eyJ1IjoibWFnZ2llb3MiLCJhIjoiY2tqbGp5ZTV0NHE2MjJycDliM3ZjcWo5YSJ9.Mmc37_rqim4SCBRJX6Y_7Q`
  )
    .then((response) => response.json())
    .then((data) => data.features)
    .then((data) => {
      data.forEach((poi) => {
        poi.distance = getDistance(
          latitude,
          longitude,
          poi.geometry.coordinates[1],
          poi.geometry.coordinates[0]
        );
      });
      data.sort((a, b) => a.distance - b.distance);
      return data;
    })
    .catch((err) => `err: ${err}`);
};

// Retrieving map and initializing location marker
const displayMap = function () {
  mapboxgl.accessToken =
    'pk.eyJ1IjoibWFnZ2llb3MiLCJhIjoiY2tqbGp5ZTV0NHE2MjJycDliM3ZjcWo5YSJ9.Mmc37_rqim4SCBRJX6Y_7Q';
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [longitude, latitude],
    zoom: 12,
  });

  marker = new mapboxgl.Marker().setLngLat([longitude, latitude]).addTo(map);
};

getUserPosition().then(() => displayMap());

// FUNCTIONS

// Calculating the distance between two points.
/* Code sourced from geodatasoruce.com */
function getDistance(lat1, lon1, lat2, lon2, unit = `K`) {
  if (lat1 == lat2 && lon1 == lon2) {
    return 0;
  } else {
    var radlat1 = (Math.PI * lat1) / 180;
    var radlat2 = (Math.PI * lat2) / 180;
    var theta = lon1 - lon2;
    var radtheta = (Math.PI * theta) / 180;
    var dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit == 'K') {
      dist = dist * 1.609344;
    }
    if (unit == 'N') {
      dist = dist * 0.8684;
    }
    return dist;
  }
}

// Removing and resetting the marker
const recenter = function (poi) {
  marker.remove();
  map.flyTo({
    center: [poi.dataset.long, poi.dataset.lat],
  });
  marker = new mapboxgl.Marker()
    .setLngLat([poi.dataset.long, poi.dataset.lat])
    .addTo(map);
};

// Creating html element
const listSearches = function (search) {
  list.innerHTML = ``;
  getPOI(search).then((poiList) =>
    poiList.forEach((poi) => {
      list.innerHTML += `<li class="poi" data-long="${
        poi.geometry.coordinates[0]
      }"data-lat="${poi.geometry.coordinates[1]}">
      <ul>
        <li class="name">${poi.text}</li>
        <li class="street-address">${poi.properties.address}</li>
        <li class="distance">${poi.distance.toFixed(1)}KM</li>
      </ul>
    </li>`;
    })
  );
};

// EVENT LISTENERS

// Listening for submit on search bar and creating response list
window.addEventListener('DOMContentLoaded', (e) => {
  form = document.querySelector(`#search`);
  search = document.getElementsByTagName(`input`)[0];
  list = document.querySelector(`.points-of-interest`);

  form.addEventListener(`submit`, (e) => {
    e.preventDefault();
    listSearches(search.value);
    search.value = '';
  });
  // Recentering marker upon click of li element
  list.addEventListener('click', (e) => {
    recenter(e.target.closest('.poi'));
  });
});
