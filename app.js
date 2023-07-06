const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const e = require('express');
const date = require(__dirname + '/date.js');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect('mongodb://127.0.0.1:27017/todolistDB');

const itemsSchema = {
    name: String
};

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});
const item2 = new Item({
    name: "Hit the + button to add a new item."
});
const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model('List', listSchema);


app.get('/', async (req, res) => {

    const foundItems = await Item.find({});
    if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
            .then(function () {
                console.log("Data inserted")  // Success
            }).catch(function (error) {
                console.log(error)      // Failure
            });
        res.redirect('/');
    } else {
        const day = date.getDay();
        res.render('list', { listTitle: day, newListItem: foundItems });
    }
});

app.get("/:customListName", async (req, res) => {
    const customListName = _.capitalize(req.params.customListName);



    const foundList = await List.findOne({ name: customListName });
    if (foundList) {
        res.render('list', { listTitle: foundList.name, newListItem: foundList.items });
    } else {
        const list = new List({
            name: customListName,
            items: defaultItems
        });

        list.save();

        res.redirect('/' + customListName);
    }


});

app.post('/', async (req, res) => {

    const listName = req.body.list;

    let itemN = new Item({
        name: req.body.toDoItem
    });

    if (listName === date.getDay()) {
        itemN.save();
        res.redirect('/');
    } else {
        const foundList = await List.findOne({ name: listName });
        foundList.items.push(itemN);
        foundList.save();
        res.redirect('/' + listName);
    }


});

app.post('/delete', async (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === date.getDay()) {
        await Item.findByIdAndRemove(checkedItemId);
        res.redirect('/');
    } else {
        await List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } });
        res.redirect('/' + listName);
    }


});


app.listen(3000, () => {
    console.log("Server is running");

});