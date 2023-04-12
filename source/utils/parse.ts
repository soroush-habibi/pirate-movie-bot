import axios from 'axios';
import dom from 'node-html-parser';

interface site {
    name: string,
    url: string
}

interface links {
    label: string,
    urls: string[]
}

export default class parse {
    static async searchSites(name: string): Promise<site[]> {
        const result: site[] = [];

        try {
            const digiMovieSearch = await axios.get(`https://digimovie.vip/?s=${name}`);
            const digiMovieData: string = await digiMovieSearch.data;

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

            const serMovieSearch = await axios.get(`https://www.sermovie5.online/search?text=${name}`, {
                insecureHTTPParser: true
            });
            const serMovieData: string = await serMovieSearch.data;

            const link2 = dom.parse(serMovieData).querySelector(".playlist-item")?.querySelector(".text-container")?.querySelector("a")?.getAttribute("href");

            if (link2) {
                result.push({
                    name: "sermovie",
                    url: "https://www.sermovie5.online" + link2
                });
            }
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

                let tags = dom.parse(digiData).querySelectorAll(".partlink");
                tags = tags.concat(dom.parse(digiData).querySelectorAll(".btn_dl"));

                const links = tags.map((value) => value.getAttribute("href"));
            } else if (url.includes("sermovie")) {

            }
        } catch (e) {
            console.log(e);
        }

        return result;
    }
}