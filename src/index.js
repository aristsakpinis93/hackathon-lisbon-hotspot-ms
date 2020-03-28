import axios from 'axios';

import awsParamStore from 'aws-param-store';

async function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export async function handler(event, context){
  const {Value: googleApiKey} = await awsParamStore.getParameter('/googleApi/apiKey');
  console.log(JSON.stringify(event));
  const coordinates = {
    lat: event.queryStringParameters.lat,
    lon: event.queryStringParameters.lon,
  };
  const radius = event.queryStringParameters.radius;
  console.log({
    coordinates,
    radius
  });
  const query = {location: `${coordinates.lat},${coordinates.lon}`,
                  radius,
                  type: 'tourist_attraction',
                  key: googleApiKey,
                  opennow: true
                };
  console.log(query);
  let response = await axios({
    method: 'GET',
    url: `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
    params: query
  });
  console.log(response.data);
  const result = response.data.results;
  let token = response.data.next_page_token;
  console.log({token});
  while (token) {
      await sleep(1000);
      response = await axios({
        method: 'GET',
        url: `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
        params: {...query, pagetoken: token}
      });
      console.log({key: googleApiKey, pagetoken: token});
      console.log(JSON.stringify(response.data));
      token = response.data.next_page_token;
      result.push(response.data.results);
  }
  console.log(JSON.stringify({result}));
  return Promise.resolve({
    statusCode: 200,
    body: JSON.stringify({
    msg: result}),
  });
}

export async function nearbySponsors(event, context){
  const {Value: googleApiKey} = await awsParamStore.getParameter('/googleApi/apiKey');
  console.log(JSON.stringify(event));
  const coordinates = {
    lat: event.queryStringParameters.lat,
    lon: event.queryStringParameters.lon,
  };
  const keyword = event.queryStringParameters.keyword;
  console.log({
    coordinates,
    keyword
  });
  const query = {location: `${coordinates.lat},${coordinates.lon}`,
                  keyword,
                  key: googleApiKey,
                  rankby: 'distance',
                  opennow: true};
  console.log(query);
  let response = await axios({
    method: 'GET',
    url: `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
    params: query
  });
  console.log(response.data);
  const result = response.data.results[0];
  console.log(JSON.stringify({result}));

  const query2 = {origins: `${coordinates.lat},${coordinates.lon}`,
                  destinations: `${result.geometry.location.lat},${result.geometry.location.lng}`,
                  key: googleApiKey,
                  mode: 'walking'
                  };

  const wayTo = await axios({
    method: 'GET',
    url: `https://maps.googleapis.com/maps/api/distancematrix/json`,
    params: query2
  });
  console.log(JSON.stringify(wayTo.data));
  return Promise.resolve({
    statusCode: 200,
    body: JSON.stringify({
    msg: {result,
          wayTo: wayTo.data.rows[0].elements[0]},
  })});
}
