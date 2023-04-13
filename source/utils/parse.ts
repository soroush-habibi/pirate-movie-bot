import axios from 'axios';
import dom from 'node-html-parser';
import { decode } from 'html-entities';

interface site {
    name: string,
    title: string,
    url: string
}

interface links {
    label: string,
    urls: string[],
    season?: string
}

export default class parse {
    static async availableSites(name: string): Promise<site[]> {
        const result: site[] = [];

        try {
            const digiMovieSearch = await axios.get(`https://digimovie.vip/?s=${name}`);
            const digiMovieData: string = await digiMovieSearch.data;

            const links = dom.parse(digiMovieData).querySelectorAll(".item_def_loop");

            let count = 0;
            for (let i of links) {
                if (count === 5) {
                    break;
                }

                const link = i.querySelector("a")?.getAttribute("href");
                let title = i.querySelector(".title_meta")?.querySelector(".left_side")?.querySelector("a")?.innerHTML;
                title = title?.slice(title?.search(/\w/));

                if (link && title) {
                    const { data } = await axios.get(link);

                    if (!data.includes("برای دانلود")) {
                        result.push({
                            name: "digimovie",
                            title: decode(title),
                            url: link
                        });
                        count++;
                    }
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
        } catch (e) {
            console.log(e);
        }

        return result;
    }

    static async getDownloadLinks(url: string): Promise<links[]> {
        const result: links[] = [];

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
                        let index: number = -1;
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
                        } else {
                            result.push({
                                label: title,
                                urls: [link],
                                season: season
                            });
                        }
                    }
                });
            } else if (url.includes("sermovie")) {

            }
        } catch (e) {
            console.log(e);
        }

        return result;
    }
}