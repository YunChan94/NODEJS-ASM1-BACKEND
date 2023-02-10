const movie = require("../models/Movies");
const genre = require("../models/Genre");
const video = require("../models/Videos");

exports.getTrending = (req, res, next) => {
  const movieList = movie.all().sort(compareValues("popularity", "desc"));
  let perPage = 20; //số lượng movie xuất hiện trên 1 page
  let page;
  //🔴page (Optional): thứ tự của trang dữ liệu muốn lấy, nếu người dùng không có parram này thì mặc định page = 1.
  if (!req.params.page) {
    page = 1;
  } else {
    page = req.params.page;
  }
  const pagingList = movieList.skip(perPage * page - perPage).limit(perPage);
  const totalPage = Math.ceil(movieList.length / perPage); //tổng số phim / số movie/page

  // Gửi dữ liệu
  res
    .status(200)
    .send({ results: pagingList, page: page, total_pages: totalPage });
};

exports.getTopRating = (req, res, next) => {
  const movieList = movie.all().sort(compareValues("vote_average", "desc"));
  let perPage = 20; //số lượng movie xuất hiện trên 1 page
  let page;
  //🔴page (Optional): thứ tự của trang dữ liệu muốn lấy, nếu người dùng không có parram này thì mặc định page = 1.
  if (!req.params.page) {
    page = 1;
  } else {
    page = req.params.page;
  }
  const pagingList = movieList.skip(perPage * page - perPage).limit(perPage);
  const totalPage = Math.ceil(movieList.length / perPage); //tổng số phim / số movie/page

  // Gửi dữ liệu
  res
    .status(200)
    .send({ results: pagingList, page: page, total_pages: totalPage });
};

exports.getMovieByGenre = (req, res, next) => {
  //Check xem user req có param genre hay chưa?
  const genreName = req.params.genreName;
  if (!genreName) {
    return res
      .status(400)
      .send({ message: "Not found gerne parram", status: 400 });
  }

  //Tìm trong genreList.json
  const genreFound = genre
    .all()
    .find((g) => g.name.toUpperCase() === genreName.toUpperCase());

  //Check xem genre được tìm thấy hay không?
  if (!genreFound) {
    return res
      .status(400)
      .send({ message: "Not found that genre id", status: 400 });
  }

  //Lọc ra movie.genre_ids có chứa genreID
  const movieList = movie
    .all()
    .filter((m) => m.genre_ids.includes(genreFound.id));

  //Xử lý phân trang
  let perPage = 20; //số lượng movie xuất hiện trên 1 page
  let page;
  if (!req.params.page) {
    page = 1;
  } else {
    page = req.params.page;
  }
  const pagingList = movieList.skip(perPage * page - perPage).limit(perPage);
  const totalPage = Math.ceil(movieList.length / perPage); //tổng số phim / số movie/page

  // Gửi dữ liệu
  res.status(200).send({
    results: pagingList,
    page: page,
    total_pages: totalPage,
    genre_name: genreFound.name,
  });
};

exports.getVideoByID = (req, res, next) => {
  //Check param film_id có trong req.body chưa?
  const filmID = req.body.film_id;
  if (!filmID) {
    return res
      .status(400)
      .send({ message: "Not found film_id parram", status: 400 });
  }

  //Tìm videoList của film
  const film = video.all().find((f) => f.id === filmID);

  //Trả lỗi nếu không tìm được film
  if (!film) {
    return res
      .status(400)
      .send({ message: "Not found film's Data", status: 400 });
  }

  //Lọc ra các video thỏa điều kiện
  const videoList = film.videos.filter(
    (v) =>
      v.official === true &&
      v.site === "YouTube" &&
      (v.type === "Trailer" || v.type === "Teaser")
  );
  //Nếu không tìm được video thỏa đk thì trả error
  if (!videoList) {
    return res.status(404).send({ message: "Not found video", status: 404 });
  }
  // Nếu chỉ có 1 giá trị
  if (videoList.length === 1) {
    //Gửi dữ liệu video đã tìm thấy
    res.status(200).send(videoList[0]);
  } else {
    // Nếu có nhiều giá trị, lấy video đầu tiên, ưu tiên trailer
    const trailer = videoList.filter((v) => v.type === "Trailer");
    //Nếu có trailer
    if (trailer.length !== 0) {
      //Sắp xếp lại mảng trailer theo published_at gần nhất, lấy video đầu tiên
      const resVideo = trailer.sort(compareDate("published_at", "desc"));
      //Gửi dữ liệu video đã tìm thấy
      res.status(200).send(resVideo[0]);
    } else {
      // Không có trailer
      //Sắp xếp lại mảng theo published_at lấy video có ngày ra mắt gần nhất
      const resVideo = videoList.sort(compareDate("published_at", "desc"));
      //Gửi dữ liệu video đã tìm thấy
      res.status(200).send(resVideo[0]);
    }
  }
};

exports.searchMovie = (req, res, next) => {
  const keyword = req.body.keyword;
  //Nếu không có keyword
  if (!keyword) {
    return res
      .status(400)
      .send({ message: "Not found keyword parram", status: 404 });
  }

  //Tìm những film phù hợp với đièu kiện
  const movieList = movie.all().filter((m) => {
    if (m.title) {
      return m.title.toUpperCase().includes(keyword.toUpperCase());
    }
    if (m.overview) {
      return m.overview.toUpperCase().includes(keyword.toUpperCase());
    }
  });

  //Trả err Nếu không tìm được kết quả phù hợp
  if (!movieList || movieList.length === 0) {
    return res.status(400).send({ message: "Not found movie", status: 400 });
  }

  //Paging
  let perPage = 20; //số lượng movie xuất hiện trên 1 page
  let page;
  if (!req.params.page) {
    page = 1;
  } else {
    page = req.params.page;
  }
  const pagingList = movieList.skip(perPage * page - perPage).limit(perPage);
  const totalPage = Math.ceil(movieList.length / perPage); //tổng số phim / số movie/page

  // Gửi dữ liệu
  res.status(200).send({
    results: pagingList,
    page: page,
    total_pages: totalPage,
  });
};

/////// Reusable Funtion ///////
// Hàm so sánh giá trị
const compareValues = (key, order = "asc") => {
  return function (a, b) {
    if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
      // nếu không tồn tại
      return 0;
    }

    const varA = typeof a[key] === "string" ? a[key].toUpperCase() : a[key];
    const varB = typeof b[key] === "string" ? b[key].toUpperCase() : b[key];

    let comparison = 0;
    if (varA > varB) {
      comparison = 1;
    } else if (varA < varB) {
      comparison = -1;
    }
    return order == "desc" ? comparison * -1 : comparison;
  };
};

const compareDate = (key, order = "asc") => {
  return function (a, b) {
    if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
      // nếu không tồn tại
      return 0;
    }
    const dA = new Date(a);
    const dB = new Date(b);
    const varA = dA.getTime();
    const varB = dB.getTime();

    let comparison = 0;
    if (varA > varB) {
      comparison = 1;
    } else if (varA < varB) {
      comparison = -1;
    }
    return order == "desc" ? comparison * -1 : comparison;
  };
};

function limit(c) {
  return this.filter((x, i) => {
    if (i <= c - 1) {
      return true;
    }
  });
}

Array.prototype.limit = limit;

function skip(c) {
  return this.filter((x, i) => {
    if (i > c - 1) {
      return true;
    }
  });
}

Array.prototype.skip = skip;
