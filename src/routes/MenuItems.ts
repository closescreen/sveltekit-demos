import { m } from "$lib/paraglide/messages";

export const menuItems: { text: string, href: string, description: string, is_main?: boolean }[] = [
    {
        text: m["menu.home"](),
        href: "/",
        description: "Домашний экран",
        is_main: true,
    },
    {
        text: m["menu.fortune_wheel"](),
        href: "/fortune-wheel",
        description:"Крутите колесо, пусть решает случай"
    }, {
        text: m["menu.variants"](),
        href: "/variants/1",
        description:"Опишите плюсы, минусы и легко выбирайте"
    },]