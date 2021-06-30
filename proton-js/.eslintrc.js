module.exports = {
  "extends": "airbnb-base",
  "rules":{
    "linebreak-style": 0,
    "no-underscore-dangle": "off"
  },
  "overrides": [
      {
        "files": ["*.spec.js"],
        "rules": {
            "no-undef": "off",
        }
      }
  ]
};
