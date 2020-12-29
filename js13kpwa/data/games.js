var entries = {
    "1": {
        parent: null,
        group: "G1",
        author: "Niklas Ulvinge",
        text: "Hello",
        date: "2020-12-29T14:55:43.533Z",
    },
    "2": {
        parent: "1",
        group: "G1",
        author: "Niklas Ulvinge",
        text: "Comment",
        date: "2020-12-29T14:55:44.533Z",
    },
    "3": {
        parent: null,
        group: "G1",
        author: "Niklas Ulvinge",
        text: "Hello again",
        date: "2020-12-29T14:55:45.533Z",
        media: [
            {
                width: 100,
                height: 100,
                id: "M1",
            },
        ],
    },
    "4": {
        parent: "3",
        group: "G1",
        author: "Niklas Ulvinge",
        text: "Comment again",
        date: "2020-12-29T14:55:46.533Z",
        media: [
            {
                width: 200,
                height: 200,
                id: "M2",
            },
        ],
    },
    "M1": {
        color: "green",
    },
    "M2": {
        color: "red",
    },
};
