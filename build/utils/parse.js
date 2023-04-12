import axios from 'axios';
import dom from 'node-html-parser';
export default class parse {
    static async searchSites(name) {
        const result = [];
        try {
            const digiMovieSearch = await axios.get(`https://digimovie.vip/?s=${name}`);
            const digiMovieData = await digiMovieSearch.data;
            const link = dom.parse(digiMovieData).querySelector(".item_def_loop")?.querySelector("a")?.getAttribute("href");
            if (link) {
                const { data } = await axios.get(link);
                if (!data.includes("برای دانلود")) {
                    result.push({
                        name: "digimovie",
                        url: link
                    });
                }
            }
            // const serMovieSearch = await axios.get(`https://www.sermovie5.online/search?text=${name}`, {
            //     insecureHTTPParser: true
            // });
            // const serMovieData: string = await serMovieSearch.data;
            // const link2 = dom.parse(serMovieData).querySelector(".playlist-item")?.querySelector(".text-container")?.querySelector("a")?.getAttribute("href");
            // if (link2) {
            //     result.push({
            //         name: "sermovie",
            //         url: "https://www.sermovie5.online" + link2
            //     });
            // }
        }
        catch (e) {
            console.log(e);
        }
        return result;
    }
    static async getDownloadLinks(url) {
        const result = [];
        try {
            if (url.includes("digimovie")) {
                const digi = await axios.get(url);
                const digiData = await digi.data;
                let showTags = dom.parse(digiData).querySelectorAll(".partlink");
                let movieTags = dom.parse(digiData).querySelectorAll(".btn_dl");
                const links = showTags.concat(movieTags).map((value) => value.getAttribute("href"));
                movieTags.map((value) => {
                    const parent = value.parentNode.parentNode.parentNode;
                    const title = parent.querySelector(".side_left")?.querySelector(".head_left_side")?.querySelector("h3")?.innerHTML;
                    const link = value.getAttribute("href");
                    if (title && link) {
                        result.push({
                            label: title,
                            urls: [link]
                        });
                    }
                });
                showTags.map((value) => {
                    const parent = value.parentNode.parentNode.parentNode.parentNode;
                    let title = parent.querySelector(".side_left")?.querySelector(".head_left_side")?.querySelector("h3")?.innerHTML;
                    let season = parent.querySelector(".side_right")?.querySelector(".title_row")?.querySelector("h3")?.innerHTML;
                    const link = value.getAttribute("href");
                    if (title && season && link) {
                        let index = -1;
                        const update = result.find((value, i) => {
                            if (value.label === title && value.season === season) {
                                index = i;
                                return true;
                            }
                        });
                        if (update && index !== -1) {
                            result.splice(index);
                            update.urls.push(link);
                            result.push(update);
                        }
                        else {
                            result.push({
                                label: title,
                                urls: [link],
                                season: season
                            });
                        }
                    }
                });
            }
            else if (url.includes("sermovie")) {
            }
        }
        catch (e) {
            console.log(e);
        }
        return result;
    }
}
