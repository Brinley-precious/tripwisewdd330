const items = document.querySelectorAll("#items li");

items.forEach(item => {
    console.log("Name:", item.dataset.name);
    console.log("Category:", item.dataset.category);
    console.log("Color:", item.dataset.color);
});