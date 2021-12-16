const _ = require('lodash');
const mock = require('./mock.json');
const fs = require('fs');

const pages = [
    'episodes',
    'podcasts',
    'stations',
    'stations_default',
    'episodes_default',
    'exclusivestations_default',
    'podcasts_default',
    'search',
    'foryou',
    'music',
    'newstalk',
    'search',
    'shows',
    'shows_default',
    'stations_default',
    'sports_default',
    'sportsleagues_default',
    'sportsteams_default',
    'test',
    '302-5219dbac-2991-42de-be8f-375fa8f2efbd',//Radio detai test
];

// const data = await fetchPages(pages);


const mergedData = mergeData(mock);

const modulesByType = mergeModulesByType(mock);

// fs.writeFileSync('test.json', JSON.stringify(modulesByType, '', 4));

const otherRootObjects = _.pickBy(mergedData, (value, key) => typeof value === 'object' && !Array.isArray(value));
const configsByType = getConfigsByType(modulesByType);
const configsSchema = getConfigsSchema(configsByType);
const baseYaml = buildYamlBase();
const yaml = buildConfigYamlScheme({...configsSchema, ...otherRootObjects}, 4);

fs.writeFileSync('cms.yaml', baseYaml + yaml);

function mergeModulesByType(modules, result = []) {
    modules.forEach(module => {
        if(module.modules){
            mergeModulesByType(module.modules, result);
        }
        result.push(module);
    });
    return result;
}
    

function getConfigsByType(modules, data = []) {
    modules.map(module => {
        if(!module.moduleType) {
            return;
        }
        const existConfigIndex = data.findIndex(item => item.moduleType === module.moduleType);

        if(existConfigIndex !== -1) {
            data[existConfigIndex] = _.merge(data[existConfigIndex], module.config);
        } else {
            data.push({
                moduleType: module.moduleType,
                ...module.config
            });
        }

        if(module.modules) {
            getConfigsByType(module.modules, data);
        }
    });

    return data;
}


function getConfigsSchema(data) {
    const schema = {};
    data.forEach(item => {
        schema[item.moduleType] = {...item};
        Object.keys(item).forEach(key => {
            if(typeof item[key] !== 'object' || Array.isArray(item[key])){
                return;
            }

            if(schema[key]) {
                schema[key] = _.merge(schema[key], item[key]);
            }else {
                schema[key] = {
                    ...item[key]
                };
            }

            schema[item.moduleType][key] = { ref: key};
        });

        delete schema[item.moduleType]['moduleType'];
    });

    return schema;
}



function buildConfigYamlScheme(data, indentation = 0, yamlObject = { yaml: ''}){
    for(const key in data) {
        const type = typeof data[key];
        const isArray = Array.isArray(data[key]);
        const isObject = type === 'object' && !Array.isArray(data[key]);
        const isRef = !!data[key]['ref'];

        if(type === 'string' || type === 'number') {
            yamlObject.yaml += `${getIndentation(indentation)}${key}:\n`;
            yamlObject.yaml += `${getIndentation(indentation + 2)}type: ${type}\n`;
        }
        
        if(isObject && isRef) {
            yamlObject.yaml += `${getIndentation(indentation)}${key}:\n`;
            yamlObject.yaml += `${getIndentation(indentation + 2)}$ref: '#/components/schemas/${key}'\n`;
        }

        if(isArray) {
            yamlObject.yaml += `${getIndentation(indentation)}${key}:\n`;
            yamlObject.yaml += `${getIndentation(indentation + 2)}type: array\n`;
            yamlObject.yaml += `${getIndentation(indentation + 2)}items:\n`;
            yamlObject.yaml += `${getIndentation(indentation + 4)}type: string\n`;
        }

        if(isObject && !isRef) {
            yamlObject.yaml += `${getIndentation(indentation)}${key}:\n`;
            yamlObject.yaml += `${getIndentation(indentation + 2)}title: ${key}\n`;
            yamlObject.yaml += `${getIndentation(indentation + 2)}type: object\n`;
            yamlObject.yaml += `${getIndentation(indentation + 2)}properties:\n`;
            buildConfigYamlScheme(data[key], indentation + 4, yamlObject);
        }
    }
    return yamlObject.yaml;
}

function buildResponseYamlScheme(data, indentation = 0, yamlObject = { yaml: ''}){
    for(const key in data) {
        const type = typeof data[key];
        const isArray = Array.isArray(data[key]);
        const isObject = type === 'object' && !Array.isArray(data[key]);
        const isRef = !!data[key]['ref'];

        if(type === 'string' || type === 'number') {
            yamlObject.yaml += `${getIndentation(indentation)}${key}:\n`;
            yamlObject.yaml += `${getIndentation(indentation + 2)}type: ${type}\n`;
        }
        
        if(isObject && isRef) {
            yamlObject.yaml += `${getIndentation(indentation)}${key}:\n`;
            yamlObject.yaml += `${getIndentation(indentation + 2)}$ref: '#/components/schemas/${key}'\n`;
        }

        if(isArray) {
            yamlObject.yaml += `${getIndentation(indentation)}${key}:\n`;
            yamlObject.yaml += `${getIndentation(indentation + 2)}type: array\n`;
            yamlObject.yaml += `${getIndentation(indentation + 2)}items:\n`;
            yamlObject.yaml += `${getIndentation(indentation + 4)}type: string\n`;
        }

        if(isObject && !isRef) {
            yamlObject.yaml += `${getIndentation(indentation)}${key}:\n`;
            yamlObject.yaml += `${getIndentation(indentation + 2)}title: ${key}\n`;
            yamlObject.yaml += `${getIndentation(indentation + 2)}type: object\n`;
            yamlObject.yaml += `${getIndentation(indentation + 2)}properties:\n`;
            buildConfigYamlScheme(data[key], indentation + 4, yamlObject);
        }
    }
    return yamlObject.yaml;
}

function mergeData(data) {
    const mergedPages = _.merge(...data);
    const mergedObject = {};
    for(let key in mergedPages){
        if(typeof mergedPages[key] === 'object' && !Array.isArray(mergedPages[key])) {
            mergedObject[key] = _.merge(..._.values(mergedPages[key]));
        }else if(Array.isArray(mergedPages[key])) {
            mergedObject[key] = [_.merge(...mergedPages[key])];
        }else {
            mergedObject[key] = mergedPages[key];
        }
    }

    return mergedObject;
}

function buildYamlBase() {
    let yaml = `openapi: 3.0.0
info:
  version: 1.0.0
  title: OpenAPI Bloomreach
paths:
  /cms:
    get:
      responses:
        '200':
          description: successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/response'
components:
  schemas:
    response:
      title: Response
      type: object
      properties:
        id:
          type: string
        type:
          type: string
        modules:
          type: array
          items:
            type: object
        query:
          type: object,
          properties:
            key:
              $ref: '#/components/schemas/CAROUSEL'
        content:
          type: object
          properties:
            key:
              $ref: '#/components/schemas/CAROUSEL'
`

    return yaml;
}

function getIndentation(space){
    return new Array(space + 1).join(' ');
}

async function fetchPages(pages) {
    const api = 'https://vpc-experience-nonprod-onuwg63twono4mxcfcslolucky.us-east-1.es.amazonaws.com/experience-content-cms-dev/_doc';
    const data = [];
    for(const page of pages) {
        try {
            const response = await axios.get(`${api}/${page}`)
            data.push(response.data._source);
        }catch (e) {
            console.log(`${api}/${page}`);
        }
    }
    return data;
}