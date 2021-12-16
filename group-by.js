const _ = require('lodash');
const fs = require('fs');
const people = require('./people.json');

const fieldsByPersonType = getFieldsByPersonType(people);
const mergedPeople = mergeDataByPersonType(people, fieldsByPersonType);
fs.writeFileSync('test.json', JSON.stringify(mergedPeople, '', 4));

function getFieldsByPersonType(people, result = {}){
    people.forEach(person => {
        const {families, ...others} = person;
        if(result[person.type]){
            result[person.type] = _.merge(result[person.type], others);
        }else {
            result[person.type] = others;
        }

        if(person.families){
            getFieldsByPersonType(person.families, result);
        }
    });

    return result;
}

function mergeDataByPersonType(people, fieldsByPersonType){
    people.forEach((person, key) => {
        people[key] = {...fieldsByPersonType[person.type], ...person};
        if(person.families){
            people[key]['count'] = person.families.length;
            mergeDataByPersonType(person.families, fieldsByPersonType);
        }
    });

    return people;
}