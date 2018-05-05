module.exports = (item => {
    switch (item.type) {
        case "function":
        case "method":
            return {signature: getFunctionSignature(item)};
        case 'class':
            return {signature: getClassSignature(item)};
        default:
            if (item.name) return {signature: item.name};
    }
});

const getFunctionSignature = ({scope, name, isAsync, isGenerator, isStatic, isChainable, params, returnType}) => {
    return ''
        + (isAsync ? 'async ' : '')
        + (scope
            ? scope + (isStatic ? '.' : '..')
            : '')
        + name
        + (isGenerator ? '*' : '')
        + '('+params.map(x => x.name).join(', ')+')'
        + (isChainable ? ' ↩' : (returnType ? ' : ' + returnType : ' : void'));
};

const getClassSignature = ({name, augments}) => {
    return 'class '
        + name
        + (augments ? ' extends ' + augments.name : '');
};
