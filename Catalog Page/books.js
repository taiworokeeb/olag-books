const books = [
    {
        id: "secret-garden",
        title: "The Secret Garden",
        author: "Frances Hodgson Burnett",
        category: "children",
        availability: "available",
        cover: "https://lcweb2.loc.gov/service/rbc/rbc0001/2002/2002juv21580/0001v.jpg",
        description: "A hidden garden, new friendships, and the joy of discovery."
    },
    {
        id: "lions-of-fifth-avenue",
        title: "The Lions of Fifth Avenue",
        author: "Fiona Davis",
        category: "fiction",
        availability: "available",
        cover: "https://www.nypl.org/scout/_next/image?url=https%3A%2F%2Fsecure.syndetics.com%2Findex.aspx%3Fisbn%3D9781524744618%2Fxlc.gif%26client%3Dnyplvega%26type%3Dunbound&w=128&q=75",
        description: "A historical novel set in the New York Public Library, where a family uncovers secrets connected to the library."
    },
    {
        id: "paris-library",
        title: "The Paris Library",
        author: "Janet Skeslien Charles",
        category: "fiction",
        availability: "available",
        cover: "https://www.nypl.org/scout/_next/image?url=https%3A%2F%2Fsecure.syndetics.com%2Findex.aspx%3Fisbn%3D9781982134198%2Fxlc.gif%26client%3Dnyplvega%26type%3Dunbound&w=128&q=75",
        description: "A story inspired by librarians who served readers in Paris during World War II."
    },
    {
        id: "what-you-wish-for",
        title: " hat You Wish For",
        author: "katherine center",
        category: "fiction",
        availability: "available",
        cover: "https://www.nypl.org/scout/_next/image?url=https%3A%2F%2Fsecure.syndetics.com%2Findex.aspx%3Fisbn%3D9781250219367%2Fxlc.gif%26client%3Dnyplvega%26type%3Dunbound&w=128&q=75",
        description: "When the new principal turns out to be the former, unrequited crush of her teen years, elementary school librarian Samantha Casey discovers that he is a changed man, determined to destroy everything she loves about the school, which forces her to take action."
    },
    {
        id: "underground-library",
        title: "The Underground Library",
        author: "Jennifer Ryan",
        category: "fiction",
        availability: "available",
        cover: "https://www.nypl.org/scout/_next/image?url=https%3A%2F%2Fsecure.syndetics.com%2Findex.aspx%3Fisbn%3D9780593500385%2Fxlc.gif%26client%3Dnyplvega%26type%3Dunbound&w=128&q=75",
        description: "When the Blitz destroys Bethnal Green Library in London, librarian Juliet Lansdown and two other women move the library's books to a local Underground station, where residents shelter nightly."
    },
    {
        id: "lost-book-of-bonn",
        title: "The Lost Book of Bonn",
        author: "Brianna Labuskes",
        category: "fiction",
        availability: "available",
        cover: "https://www.nypl.org/scout/_next/image?url=https%3A%2F%2Fsecure.syndetics.com%2Findex.aspx%3Fisbn%3D9780063259287%2Fxlc.gif%26client%3Dnyplvega%26type%3Dunbound&w=128&q=75",
        description: "Fantasy fiction about a spy who works for a mysterious, reality-hopping library."
    },
    {
        id: "littlest-library",
        title: "The Littlest Library",
        author: "Poppy Alexander",
        category: "fiction",
        availability: "available",
        cover: "https://www.nypl.org/scout/_next/image?url=https%3A%2F%2Fsecure.syndetics.com%2Findex.aspx%3Fisbn%3D9781524744618%2Fxlc.gif%26client%3Dnyplvega%26type%3Dunbound&w=128&q=75",
        description: "A librarian discovers a chance to build a little library of her own."
    },
    {
        id: "cartographers",
        title: "The Cartographers",
        author: "Peng Shepherd",
        category: "fiction",
        availability: "available",
        cover: "https://www.nypl.org/scout/_next/image?url=https%3A%2F%2Fsecure.syndetics.com%2Findex.aspx%3Fisbn%3D9780062910691%2Fxlc.gif%26client%3Dnyplvega%26type%3Dunbound&w=128&q=75",
        description: "Cartographer Nell Young discovers a seemingly worthless map is valuable—and that someone wants it destroyed."
    },
    {
        id: "library-of-lost-and-found",
        title: "The Library of Lost and Found",
        author: "Phaedra Patrick",
        category: "fiction",
        availability: "available",
        cover: "https://www.nypl.org/scout/_next/image?url=https%3A%2F%2Fsecure.syndetics.com%2Findex.aspx%3Fisbn%3D9780778369356%2Fxlc.gif%26client%3Dnyplvega%26type%3Dunbound&w=128&q=75",
        description: "A shy librarian receives a mysterious book from her grandmother and begins uncovering family secrets."
    },
    {
        id: "war-librarian",
        title: "The War Librarian",
        author: "Addison Armstrong",
        category: "fiction",
        availability: "available",
        cover: "https://www.nypl.org/scout/_next/image?url=https%3A%2F%2Fsecure.syndetics.com%2Findex.aspx%3Fisbn%3D9780593328064%2Fxlc.gif%26client%3Dnyplvega%26type%3Dunbound&w=128&q=75",
        description: "A dual-timeline historical novel about two women facing challenges during World War I and 1976."
    },
    {
        id: "library-of-the-unwritten",
        title: "The Library of the Unwritten",
        author: "A.J. Hackwith",
        category: "fiction",
        availability: "available",
        cover: "https://www.nypl.org/scout/_next/image?url=https%3A%2F%2Fsecure.syndetics.com%2Findex.aspx%3Fisbn%3D9781984806376%2Fxlc.gif%26client%3Dnyplvega%26type%3Dunbound&w=128&q=75",
        description: "A head librarian watches over unfinished books and tracks an escaped character before a powerful literary weapon is revealed."
    },
    {
        id: "book-woman-of-troublesome-creek",
        title: "The Book Woman of Troublesome Creek",
        author: "Kim Michele Richardson",
        category: "fiction",
        availability: "available",
        cover: "https://www.nypl.org/scout/_next/image?url=https%3A%2F%2Fsecure.syndetics.com%2Findex.aspx%3Fisbn%3D9781492691631%2Fxlc.gif%26client%3Dnyplvega%26type%3Dunbound&w=128&q=75",
        description: "A Pack Horse Library Project member brings books to her neighbors during the Great Depression."
    },
        {
        id: "boy-who-harnessed-the-wind",
        title: "The Boy Who Harnessed the Wind: Young Readers Edition",
        author: "William Kamkwamba and Bryan Mealer",
        category: "nonfiction",
        availability: "available",
        cover: "https://covers.openlibrary.org/b/isbn/9780147510426-L.jpg",
        description: "The true story of William Kamkwamba, a boy from Malawi who built a windmill to help bring electricity to his village."
    },
    {
        id: "diary-of-a-young-girl",
        title: "The Diary of a Young Girl",
        author: "Anne Frank",
        category: "nonfiction",
        availability: "available",
        cover: "https://covers.openlibrary.org/b/isbn/9780553296983-L.jpg",
        description: "Anne Frank's diary about her life in hiding with her family during the Nazi occupation of the Netherlands."
    },
    {
        id: "charlottes-web",
        title: "Charlotte's Web",
        author: "E.B. White",
        category: "children",
        availability: "available",
        cover: "https://covers.openlibrary.org/b/isbn/9780064400558-L.jpg",
        description: "A young girl, a pig named Wilbur, and a clever spider named Charlotte form a memorable friendship."
    },
    {
        id: "matilda",
        title: "Matilda",
        author: "Roald Dahl",
        category: "children",
        availability: "available",
        cover: "https://covers.openlibrary.org/b/isbn/9780142410370-L.jpg",
        description: "A clever young reader discovers she has a remarkable gift and stands up to unfair adults."
    },
    {
        id: "lion-witch-wardrobe",
        title: "The Lion, the Witch and the Wardrobe",
        author: "C.S. Lewis",
        category: "children",
        availability: "available",
        cover: "https://covers.openlibrary.org/b/isbn/9780064404990-L.jpg",
        description: "Four children step through a wardrobe into the magical land of Narnia."
    },
    {
        id: "tale-of-peter-rabbit",
        title: "The Tale of Peter Rabbit",
        author: "Beatrix Potter",
        category: "children",
        availability: "available",
        cover: "https://covers.openlibrary.org/b/isbn/9780241324301-L.jpg",
        description: "Peter Rabbit sneaks into Mr. McGregor's garden and finds himself in a mischievous adventure."
    }
];

window.libraryBooks = books;
