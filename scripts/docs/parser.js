// const ignored = {};
const cache = new WeakMap();
const {DataStream} = require('scramjet');

/**
 * Parses a node
 * @param  {Node} node ESTree node
 * @return {Array} array of parsed node,
 */
const _parser = (node) => {
    if (!node)
        return [];

    if (cache.has(node)) {
        return cache.get(node);
    }


    if (nodes[node.type]) {
        const ret = nodes[node.type](node);
        cache.set(node, ret);
        return ret;
    }

    // ignored[node.type] || (
    //     ignored[node.type] = console.error("ignoring first", node) || true
    // );
    return [];
};

const _parse = (node) => {
    return _parser(node)[0];
};

const _name = (node) => (node && (node.name ? node : _parse(node)) || {}).name;

const _doc = (leadingComments = []) => {
    const comments = leadingComments.concat().reverse()
        .filter(({value}) => value.startsWith('*'))
        .map(_parse)
    ;

    return [comments.shift() || {}, comments];
};

const nodes = _parser.nodes = {
    Identifier: ({name}) => [{name}],
    MemberExpression: ({object, property}) => [{name: `${_name(object)}.${_name(property)}`}],
    Position: ({line, column}) => [{line, column}],
    Program: ({body}) => [{}, body],
    Block: ({value, start}) => [{type: "doc", doc: {source: '/*' + value + '*/', start}}],
    ClassDeclaration: ({id, superClass, loc, leadingComments, body, start}) => {
        const name = _name(id);
        const [doc, comments] = _doc(leadingComments);

        return [
            Object.assign(
                doc,
                {type: "class", name, extends: _parse(superClass), start, line: loc.start.line}
            ),
            [...body.body, ...comments],
            name
        ];
    },
    VariableDeclaration: ({declarations, leadingComments, kind}) => {
        const name = _name(declarations[0].id);
        const [doc, comments] = _doc(leadingComments);

        return [
            Object.assign(
                doc,
                {type: "var", name, kind}
            ),
            comments
        ];
    },
    // VariableDeclarator: (x) => (console.log(x), []),
    MethodDefinition: ({
        loc, kind, async: isAsync, generator: isGenerator,
        expression: isExpression, static: isStatic, computed: isComputed,
        leadingComments, key, value, start
    }) => {
        const name = _name(key);
        const [doc, comments] = _doc(leadingComments);

        const isConstructor = kind === 'constructor';
        const isGet = kind === 'get';
        const isSet = kind === 'set';

        return [
            Object.assign(
                _parse(value),
                doc,
                {
                    type: "method", name, kind,
                    isAsync, isGenerator, isExpression,
                    isStatic, isComputed, isConstructor, isGet, isSet,
                    line: loc.start.line, start
                }
            ),
            comments
        ];
    },
    FunctionExpression: ({
        id, async: isAsync, generator: isGenerator, expression: isExpression,
        leadingComments, loc, start}) => {
        const name = _name(id);
        const [doc, comments] = _doc(leadingComments);

        return [
            Object.assign(
                doc,
                {type: "function", name, isAsync, isGenerator, isExpression, line: loc.start.line, start}
            ),
            comments
        ];
    }
};

const walkChildren = async(target, children, scope, defaults) => {
    await (
        DataStream.fromArray(children)
            .map(child => walk(target, child, scope, defaults))
            .toArray()
    );
};

const walk = async(target, body, scope = [], defaults = {}) => {
    const [output, children = [], pathAddition = ''] = _parser(body);

    if (output)
        await target.whenWrote(Object.assign({scope}, defaults, output));

    if (pathAddition) {
        scope = [...scope, pathAddition];
    }

    if (children.length)
        await walkChildren(target, children, scope, defaults);
};

module.exports = async (out, {name, file, ast}) => {
    await walk(out, ast, [], {name, file});
    return out;
};
