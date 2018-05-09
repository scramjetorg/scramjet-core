const doctrine = require('doctrine');

const mapper = (data) => {
    const {doctrine, espree} = data;
    const specifics = {};

    const file = espree.file.replace(/\.[^.]{1-4}$/, '');
    const type = getType(doctrine, espree);
    const name = getName(doctrine, espree);
    const scope = getScope(doctrine, espree);

    const location = getLocation(doctrine);

    const id = getId(doctrine, espree);

    const description = getValue("description", null, doctrine);
    const summary = getValue("summary", doctrine, espree) || description && description.split(/\r?\n/)[0];

    switch(type) {
        case "function":
        case "method":
            specifics.params = getParams(doctrine);
            specifics.returnType = doctrine.return && doctrine.return[0].type ? getVarType(doctrine.return[0].type) : '';
            specifics.returnDescription = doctrine.return && doctrine.return[0].description;
            specifics.isStatic = espree.isStatic || getBool('static', doctrine);
            specifics.isAsync = espree.isAsync || getBool('async', doctrine);
            specifics.isChainable = getBool('chainable', doctrine) || specifics.returnType === scope[scope.length - 1];
            specifics.isGenerator = espree.isGenerator || getBool('generator', doctrine);
            specifics.isExpression = espree.isExpression || getBool('expression', doctrine);
            specifics.isInternal = getBool('internal', doctrine);
            break;
        case 'class':
            specifics.augments = getValue('extends', doctrine) || getValue('augments', doctrine) || espree.extends;
            break;
    }

    specifics.tags = Object.entries(doctrine).reduce(
        (acc, [key, value]) => (Array.isArray(value) && (acc[key] = value[0]), acc),
        {}
    );

    return Object.assign({
        id,
        file,
        type,
        location,
        description,
        summary,
        scope,
        name
    }, specifics);
};


const getId = ({id}, espree) => {
    return id ? id[0].value : [espree.file, espree.start].join(':');
};
const getLocation = ({loc}) => loc && loc.start.line;

const getType = (doctrine, espree) => {
    return doctrine && ["intro", "fileoverview", "class", "method", "function"].find(x => doctrine[x]) || espree.type;
};

const getValue = (value, doctrine, espree) => {
    return doctrine && doctrine[value] && doctrine[value].length && doctrine[value][0].value || (espree && espree[value]);
};
const getBool = (value, doctrine) => {
    return doctrine && value in doctrine;
};

const getName = (doctrine, espree) => {
    return getValue('name', doctrine, espree);
};

const getScope = (doctrine, espree) => {
    const scope = getValue('scope', doctrine, espree);

    if (typeof scope === 'string')
        return scope;

    return scope.join('.');
};

const getVarType = (doctrineType) => doctrine.type.stringify(doctrineType);

const getParams = ({param = []}) => {
     return param.map(
         ({name, type, description}) => ({name, type: getVarType(type), description})
     );
};

module.exports = (stream) => {
    return stream.map(
        (espree) => {
            const doc = espree.doc;

            let doctrineOutput = {};
            if (doc && doc.source) {
                doctrineOutput = doctrine.parse(doc.source, {unwrap: true, sloppy: true});

                doctrineOutput.tags.forEach(x => {
                    (doctrineOutput[x.title] || (doctrineOutput[x.title] = [])).push(x);
                });
                delete doctrineOutput.tags;
            }

            return {
                espree,
                doctrine: doctrineOutput
            };
        }
    )
    .map(mapper);
};
