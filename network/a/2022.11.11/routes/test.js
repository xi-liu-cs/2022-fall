const Group = require('../model/group.model');

let router = require('express').Router(),
test = require('../model/test');

router.route('/').get((req, res) =>
{
    test.find()
        .then(locations => res.json(locations))
        .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/add').post((req, res) =>
{
    let idx = req.body.idx,
    a = req.body.a,
    new_test = new test({idx: idx, a: a});

    new_test.save()
        .then(() => res.json('test added'))
        .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/push').post((req, res) =>
{
    let filter = {idx: req.body.idx},
    update = {$push: {a: "32"}};
    test.findOneAndUpdate(filter, update)
    .then(test => res.json(test))
    .catch(e => res.status(400).json('error: ' + e));
});

router.route('/pop').post((req, res) =>
{
    let filter = {idx: req.body.idx},
    update = {$pop: {a: 1}}; /* remove last element from a */
    test.findOneAndUpdate(filter, update)
    .then(test => res.json(test))
    .catch(e => res.status(400).json('error: ' + e));
});

router.route('/pull').post((req, res) =>
{
    let filter = {idx: req.body.idx},
    update = {$pull: {a: "32"}};
    test.findOneAndUpdate(filter, update)
    .then(test => res.json(test))
    .catch(e => res.status(400).json('error: ' + e));
});

router.route('/remove_i').post((req, res) =>
{
    let filter = {idx: req.body.idx},
    update =
    {
        $function:
        {
            body:
            function(a)
            {
                a.splice(req.body.i, 1);
                return a;
            },
            args: ["$a"],
            lang: "js"
        }
    };
    test.findOneAndUpdate(filter, update, {new: true})
    .then(test => res.json(test))
    .catch(e => res.status(400).json('error: ' + e));
});

module.exports = router;