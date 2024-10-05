let taskNameInput = document.querySelector("#task-name-input");
let addTaskButton = document.querySelector("#add-task-btn");
let startMessage = document.querySelector("#start-message");
let taskList = document.querySelector(".task-list");
let filters = document.querySelector(".filter");
let changeView = document.querySelector(".show-task");
let container = document.querySelector(".container");
let today = new Date().toISOString().slice(0, 10);


window.addEventListener("load", function () {
    tasksListView.showAll();
    taskNameInput.focus();
});

class Task {
    static taskId = -1;

    constructor(text) {
        this.text = text;
        this.isDone = false;
        this.date;
        Task.taskId++;
    }
}

let dataService = {
    tasks: [],

    get allTasks() {
        return this.tasks;
    },

    get completedTasks() {
        return this.tasks.filter(task => task.isDone == true);
    },

    get notCompletedTasks() {
        return this.tasks.filter(task => task.isDone == false);
    },

    get sortByDate() {
        return this.tasks.sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        })
    },

    get sortById() {
        return this.tasks.sort((a, b) => {
            return a.taskId - b.taskId;
        })
    },

    add(task) {
        this.tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        if (this.tasks.length != []) {
            const maxId = this.tasks.reduce((max, item) => item.taskId > max ? item.taskId : max, 0);
            task.taskId = maxId + 1;
        }
        else {
            task.taskId = Task.taskId;
        }
        this.tasks.push(task);
        this.save();
    },
    delete(task) {
        let index = this.tasks.indexOf(task);
        if (index > -1) this.tasks.splice(index, 1);
        if (this.tasks.length === 0) {
            startMessage.style.display = "flex";
            filters.style.display = "none";
        }
        this.save();
    },
    save() {
        localStorage.setItem("tasks", JSON.stringify(this.tasks));
    },
    open() {
        this.tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    }
}

class TasksListView {
    element;
    dataService;

    constructor(element) {
        this.element = element;
        dataService = dataService;
    }


    #drawList(tasksElements) {
        this.element.innerHTML = "";

        tasksElements.forEach(taskElement => {
            taskElement.createIn(this.element);
        });
    }

    drawTasks(args) {
        let taskElements = [];
        let tasks = args;
        if (tasks.length == 0) return;

        tasks.forEach(task => {
            taskElements.push(new TaskView(task));
        });
        this.#drawList(taskElements);
    }

    showAll() {
        let taskElements = [];
        let tasks = dataService.allTasks;

        if (tasks.length != 0) {
            startMessage.style.display = "none";
            filters.style.display = "flex";
        }
        else {
            return;
        }

        tasks.forEach(task => {
            taskElements.push(new TaskView(task));
        });
        this.#drawList(taskElements);
    }

    showCompleted() {
         this.drawTasks(dataService.completedTasks);
    }
    showNotCompleted() {
         this.drawTasks(dataService.notCompletedTasks);
    }
    sortDate() {
         this.drawTasks(dataService.sortByDate);
    }
    sortId() {
         this.drawTasks(dataService.sortById);
    }
}

class TaskView {
    flag = true;
    inputChange = document.createElement("input");

    constructor(task) {
        this.task = task;
        this.div = null;
    }

    createIn(element) {
        this.div = document.createElement("div");
        this.div.classList.add("task");

        let input = document.createElement("input");
        input.type = "checkbox";

        let p = document.createElement("p");
        p.innerText = this.task.text;

        let dateInput = document.createElement("input");
        dateInput.type = "date";
        let today = new Date().toISOString().slice(0, 10);
        dateInput.min = today;
        dateInput.setAttribute("id", "date");
        dateInput.value = this.task.date;

        let divInfo = document.createElement("div");
        divInfo.append(p, dateInput);
        divInfo.classList.add("list-item-info");

        if (this.task.isDone) {
            this.div.classList.add("completed");
            input.checked = true;
        }
        element.append(this.div);

        let btnDelete = document.createElement("button");
        btnDelete.classList.add("delete");

        let btnEdit = document.createElement("button");
        btnEdit.classList.add("edit");
        if (this.task.date < today) {
            this.div.classList.add("expired");
            input.style.display = "none";
            btnEdit.style.display = "none";
        }

        this.div.append(input, divInfo, btnEdit, btnDelete);

        input.addEventListener("click", this.changeState.bind(this));

        btnDelete.addEventListener("click", this.deleteTask.bind(this));

        btnEdit.addEventListener("click", this.editTask.bind(this));

        dateInput.addEventListener("change", this.editDate.bind(this));
    }

    deleteTask() {
        dataService.delete(this.task);
        this.div.remove();
    }

    changeState(element) {
        this.task.isDone = !this.task.isDone;
        dataService.save();
        this.div.classList.toggle("completed");
    }

    editTask() {
        let p = this.div.querySelector("p");
        let divInfo = this.div.querySelector(".list-item-info");
        this.inputChange.classList.add("changeTask");
        if (this.flag) {
            divInfo.prepend(this.inputChange);
            this.div.querySelector(".edit").classList.toggle("done");
            this.inputChange.value = p.innerText;
            p.style.display = "none";
            this.inputChange.focus();
        } else {
            this.div.querySelector(".edit").classList.toggle("done");
            p.innerText = this.inputChange.value;
            p.style.display = "block";
            this.inputChange.remove();
            this.task.text = this.inputChange.value;
            dataService.save();
        }
        this.flag = !this.flag;
    }

    editDate() {
        this.task.date = this.div.querySelector("#date").value;
        dataService.save();
    }
}



dataService.open();
let tasksListView = new TasksListView(taskList);

addTaskButton.addEventListener("click", addTaskHandler);

taskNameInput.addEventListener("keydown", function (e) {
    if (e.code == "Enter") addTaskHandler();
})


function addTaskHandler() {
    if (taskNameInput.value) {
        taskNameInput.classList.remove("empty");
        taskNameInput.classList.add("add-input");
        taskNameInput.placeholder = "Write a task";
        if (!startMessage.hidden) startMessage.hidden = true;
        let newTask = new Task(taskNameInput.value);
        dataService.add(newTask);
        filters.style.display = "flex";
        tasksListView.showAll();
        taskNameInput.value = "";
    } else {
        taskNameInput.classList.remove("add-input");
        taskNameInput.classList.add("empty");
        taskNameInput.placeholder = "You need to add a task!"
    }
}

function showAllHandler() {
    tasksListView.showAll();
}

function showCompletedHandler() {
    tasksListView.showCompleted();
}

function showNotCompletedHandler() {
    tasksListView.showNotCompleted();
}

function showSortDateHandler() {
    tasksListView.sortDate();
}

function showSortIdHandler() {
    tasksListView.sortId();
}

filters.addEventListener("change", () => {
    switch (filters.value) {
        case "1":
            showAllHandler();
            break;
        case "2":
            showNotCompletedHandler();
            break;
        case "3":
            showCompletedHandler();
            break;
        case "4":
            showSortDateHandler();
            break;
        case "5":
            showSortIdHandler();
            break;
    }
});