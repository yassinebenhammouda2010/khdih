const booksContainer =
    document.getElementById("bukhari-books");

const searchInput =
    document.getElementById("bukhari-search");


const books = [
    {
        id: 1,
        title: "كتاب بدء الوحي",
        description: "بدء نزول الوحي"
    },

    {
        id: 2,
        title: "كتاب الإيمان",
        description: "أبواب الإيمان"
    },

    {
        id: 3,
        title: "كتاب العلم",
        description: "أبواب العلم"
    },

    {
        id: 4,
        title: "كتاب الوضوء",
        description: "أحكام الوضوء"
    },

    {
        id: 5,
        title: "كتاب الغسل",
        description: "أحكام الغسل"
    },

    {
        id: 6,
        title: "كتاب الصلاة",
        description: "أبواب الصلاة"
    }
];


function displayBooks(list) {

    booksContainer.innerHTML = "";


    list.forEach((book) => {

        const card =
            document.createElement("a");

        card.href =
            `bukhari-book.html?book=${book.id}`;

        card.className =
            "bukhari-card";


        card.innerHTML = `

            <div class="book-number">
                ${book.id}
            </div>

            <div>

                <h3>
                    ${book.title}
                </h3>

                <p>
                    ${book.description}
                </p>

            </div>

        `;


        booksContainer.appendChild(card);

    });

}


searchInput.addEventListener(
    "input",
    () => {

        const search =
            searchInput.value
                .trim()
                .toLowerCase();


        const filtered =
            books.filter((book) => {

                return (
                    book.title
                        .toLowerCase()
                        .includes(search)

                    ||

                    book.description
                        .toLowerCase()
                        .includes(search)
                );

            });


        displayBooks(filtered);

    }
);


displayBooks(books);