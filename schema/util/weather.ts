export type Coordinates = {
  lat: number,
  lon: number
}

export type OneCallResponse = {
  lat: number
  lon: number
  timezone: string
  timezone_offset: number
  current: CurrentWeather
  minutely: Minutely[]
  hourly: Hourly[]
  daily: Daily[]
  alerts: Alert[]
}

export type CurrentWeather = {
  dt: number
  sunrise: number
  sunset: number
  temp: number
  feels_like: number
  pressure: number
  humidity: number
  dew_point: number
  uvi: number
  clouds: number
  visibility: number
  wind_speed: number
  wind_deg: number
  wind_gust?: number
  rain?: rain1hr
  snow?: snow1hr
  weather: Weather[]
}

export type rain1hr = {
  "1h": number // rain volume in mm
}

export type snow1hr = {
  "1h": number // snow volume in mm
}

export type Weather = {
  id: number
  main: string
  description: string
  icon: string
}

export type Minutely = {
  dt: number
  precipitation: number
}

export type Hourly = {
  dt: number
  temp: number
  feels_like: number
  pressure: number
  humidity: number
  dew_point: number
  uvi: number
  clouds: number
  visibility: number
  wind_speed: number
  wind_deg: number
  wind_gust?: number
  rain?: rain1hr
  snow?: snow1hr
  weather: Weather[]
  pop: number
}

export type Daily = {
  dt: number
  sunrise: number
  sunset: number
  moonrise: number
  moonset: number
  moon_phase: number
  summary: string
  temp: DayTemp
  feels_like: DayFeelsLike
  pressure: number
  humidity: number
  dew_point: number
  wind_speed: number
  wind_deg: number
  wind_gust?: number
  weather: Weather[]
  clouds: number
  pop: number
  rain?: number // rain volume in mm
  snow?: number // snow volume in mm
  uvi: number
}

export type DayTemp = {
  day: number
  min: number
  max: number
  night: number
  eve: number
  morn: number
}

export type DayFeelsLike = {
  day: number
  night: number
  eve: number
  morn: number
}

export type Alert = {
  sender_name: string
  event: string
  start: number
  end: number
  description: string
  tags: string[]
}

export function renderDescription(description: string) {
  switch (description) {
    case 'Clouds':
      return 'Cloudy';
    case 'Rain':
      return 'Rainy';
    case 'Snow':
      return 'Snowy';
    default:
      return description;
  }
}

/*
Example response from OpenWeather API one call 3.0:
https://openweathermap.org/api/one-call-3
{
 "lat":33.44,
 "lon":-94.04,
 "timezone":"America/Chicago",
 "timezone_offset":-18000,
 "current":{
    "dt":1684929490,
    "sunrise":1684926645,
    "sunset":1684977332,
    "temp":292.55,
    "feels_like":292.87,
    "pressure":1014,
    "humidity":89,
    "dew_point":290.69,
    "uvi":0.16,
    "clouds":53,
    "visibility":10000,
    "wind_speed":3.13,
    "wind_deg":93,
    "wind_gust":6.71,
    "weather":[
       {
          "id":803,
          "main":"Clouds",
          "description":"broken clouds",
          "icon":"04d"
       }
    ]
 },
 "minutely":[
    {
       "dt":1684929540,
       "precipitation":0
    },
    ...
 ],
 "hourly":[
    {
       "dt":1684926000,
       "temp":292.01,
       "feels_like":292.33,
       "pressure":1014,
       "humidity":91,
       "dew_point":290.51,
       "uvi":0,
       "clouds":54,
       "visibility":10000,
       "wind_speed":2.58,
       "wind_deg":86,
       "wind_gust":5.88,
       "weather":[
          {
             "id":803,
             "main":"Clouds",
             "description":"broken clouds",
             "icon":"04n"
          }
       ],
       "pop":0.15
    },
    ...
 ],
 "daily":[
    {
       "dt":1684951200,
       "sunrise":1684926645,
       "sunset":1684977332,
       "moonrise":1684941060,
       "moonset":1684905480,
       "moon_phase":0.16,
       "summary":"Expect a day of partly cloudy with rain",
       "temp":{
          "day":299.03,
          "min":290.69,
          "max":300.35,
          "night":291.45,
          "eve":297.51,
          "morn":292.55
       },
       "feels_like":{
          "day":299.21,
          "night":291.37,
          "eve":297.86,
          "morn":292.87
       },
       "pressure":1016,
       "humidity":59,
       "dew_point":290.48,
       "wind_speed":3.98,
       "wind_deg":76,
       "wind_gust":8.92,
       "weather":[
          {
             "id":500,
             "main":"Rain",
             "description":"light rain",
             "icon":"10d"
          }
       ],
       "clouds":92,
       "pop":0.47,
       "rain":0.15,
       "uvi":9.23
    },
    ...
 ],
  "alerts": [
  {
    "sender_name": "NWS Philadelphia - Mount Holly (New Jersey, Delaware, Southeastern Pennsylvania)",
    "event": "Small Craft Advisory",
    "start": 1684952747,
    "end": 1684988747,
    "description": "...SMALL CRAFT ADVISORY REMAINS IN EFFECT FROM 5 PM THIS\nAFTERNOON TO 3 AM EST FRIDAY...\n* WHAT...North winds 15 to 20 kt with gusts up to 25 kt and seas\n3 to 5 ft expected.\n* WHERE...Coastal waters from Little Egg Inlet to Great Egg\nInlet NJ out 20 nm, Coastal waters from Great Egg Inlet to\nCape May NJ out 20 nm and Coastal waters from Manasquan Inlet\nto Little Egg Inlet NJ out 20 nm.\n* WHEN...From 5 PM this afternoon to 3 AM EST Friday.\n* IMPACTS...Conditions will be hazardous to small craft.",
    "tags": [
    ]
  },
  ...
]
*/