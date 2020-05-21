// Generated by CoffeeScript 1.12.7
(function () {
  var getKeys, buildFM, addslashes, addslashes_single_quotes, FileMakerCodeGenerator;

  (function (root) {
    return root.Mustache = require("mustache.js") || root.Mustache;
  })(this);

  (function (root) {
    return root.Base64 = require("Base64.js") || root.Base64;
  })(this);

  addslashes = function (str) {
    return ("" + str).replace(/[\\"]/g, '\\$&');
  };

  addslashes_single_quotes = function (str) {
    return ("" + str).replace(/\\/g, '\\$&').replace(/'/g, "'\"'\"'");
    //return ("" + str).replace(/\\/g, '\\$&').replace(/'/g, "'\"'\"'");
  };

  getKeys = function (object) {
    return Object
      .entries(object)
      .reduce((r, [k, v]) =>
        r.concat(v && typeof v === 'object' ?
          getKeys(v).map(sub => [k].concat(sub)) :
          k
        ), []
      );
  };

  buildFM = function (object) {

    var objLength = object.length;
    var i = 1;
    var str = '';
    for (x of object) {
      var nodes = x.split(/\.(?=[^\.]+$)/);
      if (i == objLength) {
        str += '[ "' + x + '" ; $' + ' ; JSONString ]';
      } else {
        str += '[ "' + x + '" ; $' + ' ; JSONString ] ; ';
      }
      i++;
    }
    return str;
  };

  FileMakerCodeGenerator = function () {
    var self;
    self = this;
    this.headers = function (request) {
      var auth, header_name, header_value, headers;
      headers = request.headers;
      auth = null;
      if (headers['Authorization']) {
        auth = this.auth(request, headers['Authorization']);
        if (auth) {
          delete headers['Authorization'];
        }
      }
      return {
        "has_headers": Object.keys(headers).length > 0,
        "header_list": (function () {
          var results;
          results = [];
          for (header_name in headers) {
            header_value = headers[header_name];
            if (header_name === 'Authorization' || header_value.indexOf('Bearer') >= 0) {
              results.push({
                "header_name": addslashes_single_quotes(header_name),
                "header_value": addslashes_single_quotes('Bearer ' + "\" & $access_token & \"")
              })
            } else {
              results.push({
                "header_name": addslashes_single_quotes(header_name),
                "header_value": addslashes_single_quotes(header_value)
              })
            };
          }
          return results;
        })(),
        "auth": auth
      };
    };
    this.auth = function (request, authHeader) {
      var DVpass, DVuser, decoded, digestDS, digestDV, err, match, params, password, scheme, username, userpass;
      if (self.options.useHeader) {
        return null;
      }
      match = authHeader.match(/([^\s]+)\s(.*)/) || [];
      scheme = match[1] || null;
      params = match[2] || null;
      if (scheme === 'Basic') {
        try {
          decoded = Base64.atob(params);
        } catch (error) {
          err = error;
          return null;
        }
        userpass = decoded.match(/([^:]*):?(.*)/);
        return {
          "username": addslashes_single_quotes("\" & $username & \"" || ''),
          "password": addslashes_single_quotes("\" & $password & \"" || '')
        };
      }
      digestDS = request.getHeaderByName('Authorization', true);
      if (digestDS && digestDS.length === 1 && digestDS.getComponentAtIndex(0).type === 'com.luckymarmot.PawExtensions.DigestAuthDynamicValue') {
        digestDV = digestDS.getComponentAtIndex(0);
        DVuser = digestDV.username;
        username = '';
        if (typeof DVuser === 'object') {
          username = DVuser.getEvaluatedString();
        } else {
          username = DVuser;
        }
        DVpass = digestDV.password;
        password = '';
        if (typeof DVpass === 'object') {
          password = DVpass.getEvaluatedString();
        } else {
          password = DVpass;
        }
        return {
          "isDigest": true,
          "username": addslashes_single_quotes(username),
          "password": addslashes_single_quotes(password)
        };
      }
      return null;
    };
    this.body = function (request) {
      var has_tabs_or_new_lines, json_body, multipart_body, name, raw_body, url_encoded_body, value;
      url_encoded_body = request.urlEncodedBody;
      if (url_encoded_body) {
        return {
          "has_url_encoded_body": true,
          "url_encoded_body": (function () {
            var results;
            results = [];
            for (name in url_encoded_body) {
              value = url_encoded_body[name];
              results.push({
                "name": addslashes(name),
                "value": addslashes('$' + name)
              });
            }
            return results;
          })()
        };
      }
      multipart_body = request.multipartBody;
      if (multipart_body) {
        return {
          "has_multipart_body": true,
          "multipart_body": (function () {
            var results;
            results = [];
            for (name in multipart_body) {
              value = multipart_body[name];
              results.push({
                "name": addslashes(name),
                "value": addslashes('$' + name)
              });
            }
            return results;
          })()
        };
      }
      json_body = request.jsonBody;
      if (json_body != null) {
        return {
          "has_raw_body_with_tabs_or_new_lines": true,
          "has_raw_body_without_tabs_or_new_lines": false,
          "raw_body": "$json" //addslashes_single_quotes(JSON.stringify(json_body, null, 2))
        };
      }
      raw_body = request.body;
      if (raw_body) {
        if (raw_body.length < 5000) {
          has_tabs_or_new_lines = null !== /\r|\n|\t/.exec(raw_body);
          return {
            "has_raw_body_with_tabs_or_new_lines": has_tabs_or_new_lines,
            "has_raw_body_without_tabs_or_new_lines": !has_tabs_or_new_lines,
            "raw_body": has_tabs_or_new_lines ? addslashes_single_quotes(raw_body) : addslashes(raw_body)
          };
        } else {
          return {
            "has_long_body": true
          };
        }
      }
    };
    this.fmFunction = function (request) {      
      var body = request.body;
      var obj = JSON.parse(body);
      var result = getKeys(obj);

      const array_mapper = (v, i, arr) => {
        if (i > 0) {
          return v.match(/^\d+$/)
            ? "[" + v + "]"
            : "." + v;
        }
        return v
      }

      var fmMap;
      fmMap = result.map(a => Array.isArray(a) ? a.map(array_mapper).join("") : a);

      var fmFX;
      var fmFX = buildFM(fmMap);
      var jse = 'JSONSetElement ( “{}” ; ' + fmFX + ')';

      return {
        
        "fmVar": jse
  
      };

    };
    this.params = function (request) {
      var queryParams;
      queryParams = request.urlQuery;
      var fragments = queryParams.split('&');
      return {
        "has_query_parameters": true,
        "query_parameters": (function () {
          var results;
          results = [];
          if (queryParams.length != 0) {
            for (i in fragments) {
              var keyvalue = fragments[i].split('=')
              name = keyvalue[0];
              if (parseInt(i) === 0) {
                results.push(keyvalue[0] + '=" & ' + '$' + keyvalue[0]);
              } else {
                results.push('&' + keyvalue[0] + '=" & ' + '$' + keyvalue[0]);
              }
            }
          }
          return results.join(" & \"");
        })()
      };
    };
    this.url = function (context, request) {
      var requestUrl = request.getUrlBase(true); // DynamicString
      var components = requestUrl.components; // Array of DynamicString
      var urlPattern = ''; // string
      for (var i = 0; i < components.length; i++) {
        var component = components[i];
        if (typeof component === 'string') {
          // component (string)
          urlPattern += component;
        }
        else {
          // request variable
          if (component.type === 'com.luckymarmot.RequestVariableDynamicValue') {
            var requestVariable = request.getVariableById(component.variableUUID);
            if (requestVariable) {
              urlPattern += '{' + requestVariable.name + '}';
            }
            else {
              urlPattern += '{unknown}';
            }
          }
          // environment variable
          else if (component.type === 'com.luckymarmot.EnvironmentVariableDynamicValue') {
            var envVariable = context.getEnvironmentVariableById(component.environmentVariable);
            if (envVariable) {
              if (i < components.length - 1) {
                urlPattern += '" & $' + envVariable.name + ' & "'
              } else {
                urlPattern += '" & $' + envVariable.name + ''
              }
            }
            else {
              urlPattern += '[unknown]';
            }
          }
          // string
          else {
            urlPattern += component.getEvaluatedString();
          }
        }
      }
      params = request.urlQuery;
      if (params.length === 0) {
        return '"' + urlPattern + '';
      } else {
        return '"' + urlPattern + ' & "?';
      };
    };
    this.strip_last_backslash = function (string) {
      var i, j, lines, ref;
      lines = string.split("\n");
      for (i = j = ref = lines.length - 1; ref <= 0 ? j <= 0 : j >= 0; i = ref <= 0 ? ++j : --j) {
        lines[i] = lines[i].replace(/\s*\\\s*$/, "");
        if (!lines[i].match(/^\s*$/)) {
          break;
        }
      }
      return lines.join("\n");
    };
    this.generateRequest = function (context, request) {
      var rendered_code, template, view;
      view = {
        "request": request,
        "request_is_head": request.method === "HEAD",
        "specify_method": request.method !== "HEAD",
        "headers": this.headers(request),
        "body": this.body(request),
        "params": this.params(request),
        "url": this.url(context, request),
        "fmFunction": this.fmFunction(request)
      };
      if (view.request.description) {
        view.request.cURLDescription = view.request.description.split('\n').map(function (line, index) {
          return "# " + line;
        }).join('\n');
      } else {
        view.request.cURLDescription = '';
      }
      template = readFile("FileMaker.mustache");
      rendered_code = Mustache.render(template, view);
      return this.strip_last_backslash(rendered_code);
    };
    this.generate = function (context, requests, options) {
      var curls;
      self.options = (options || {}).inputs || {};
      curls = requests.map(function (request) {
        return self.generateRequest(context, request);
      });
      return curls.join('\n');
    };
  };

  FileMakerCodeGenerator.identifier = "com.proofgroup.PawExtensions.FileMakerCodeGenerator";

  FileMakerCodeGenerator.title = "FileMaker";

  FileMakerCodeGenerator.fileExtension = "sh";

  FileMakerCodeGenerator.languageHighlighter = "bash";

  registerCodeGenerator(FileMakerCodeGenerator);

}).call(this);

