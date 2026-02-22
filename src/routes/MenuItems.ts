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
        description: "Крутите колесо, пусть решает случай"
    }, {
        text: m["menu.variants"](),
        href: "/variants/1",
        description: "Опишите плюсы, минусы и легко выбирайте"
    },
    {
        text: 'Корзина покупателя (демо)',
        href: '/cart',
        description: 'Демо-корзина покупателя. Эксперимент, насколько легко создавать такие страницы'
    },
    {
        text: '1024 с танцевальным ковриком',
        href: '/1024',
        description: 'Можно ли с помощью usb-танцевального коврика играть в 1024? Если переназначить клавиши, то почему нет?'
    }
]