import React, { useState, useEffect, useRef, useUrlState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';

import '../index.css'

import 'github-markdown-css'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'



import { getHeptabaseData, getClearCard, getClearImag } from '../constantFunction'


// 文章正文
function Container(props) {
    
    // 记录文章的 DOM 信息，用来处理 DOM 元素，例如修改图片样式
    let post = useRef(null);

    // 当前路径信息
    let path = window.location.pathname

    // 路径中包含的 post id，用以获取文章 md 信息
    let path_id
    if (path.indexOf('/post/') < 0) {

        // 若路径中不含 post id，则取父组件的 props
        path_id = props.post_id

    } else {
        path_id = path.replace('/post/', '')
    }



    // 记录数据加载状态
    let [isLoading, setLoadingState] = useState(true)

    // 记录当前文章的 ID
    let [thisPageId, setPageID] = useState('')

    // 记录自定义的 Link 数据，用来实现 DOM 链接的间接跳转
    let [my_link, setLink] = useState('');

    // 记录当前文章对应的卡片信息
    let [card, setCard] = useState('card');

    // let [heptabase_data, setHeptabaseData] = useState('heptabase_data');
    // let { slug } = useParams();

    // 如果当前页面 ID 为空则获取数据
    if (thisPageId == '') {
        setPageID(props.post_id)
    }


    // 如果是移动端则增加图片的尺寸
    let isMobile = navigator.userAgent.match(/Mobile/i)
    let mobileSkale = 1
    if (isMobile) {
        mobileSkale = 2
    }

    // 获取文章数据、处理文章数据
    const setContent = (id) => {
        console.log('setContent');

        // 存储数据的变量
        let heptabase_blog_data
        getHeptabaseData.then((res) => {
            heptabase_blog_data = res.data
            let new_card = null
            console.log('Container setContent for:');
            for (let i = 0; i < heptabase_blog_data.cards.length; i++) {

                if (heptabase_blog_data.cards[i]['id'] == id) {

                    // 处理内容中的图片
                    heptabase_blog_data.cards[i] = getClearImag(heptabase_blog_data.cards[i])
                    console.log('getClearImag done');
                    // 处理内容中的链接
                    new_card = getClearCard(heptabase_blog_data.cards[i], heptabase_blog_data.cards)
                    heptabase_blog_data.cards[i] = new_card['card']

                    setCard(new_card)
                    setLoadingState(false)
                    break;
                }
            }

            // 404
            if(new_card==null){
                console.log('404');
                window.location = '/404'
            }
        })

    }

    // 组件生命周期，组件载入、更新时将触发此函数
    useEffect(() => {

        console.log('useEffect');

        //设置页面内容
        if (card === 'card') {
            // 如果 card 无内容，则获取数据
            setContent(path_id)
        } else {

            
            if (card['card']['id'] !== path_id) {

                // 如果 card 的 ID 与当前 URL 中的 ID 不一致
                console.log('useEffect setContent');
                // 获取新 URL 中的文章 ID 对应的 md 数据
                setContent(path_id)
                // 清空旧页面的自定义链接
                setLink('')
                
            }
        }

        // dom 加载完毕后
        if (post.current != null && card['card']['id'] == path_id) {

            // 设置 img 的尺寸
            let article_img = document.getElementsByTagName('img');
            console.log(article_img);

            for (let i = 0; i < article_img.length; i++) {
                let width_key_index = article_img[i]['alt'].indexOf('{{width ')
                if (width_key_index > -1) {
                    let img_width = article_img[i]['alt'].substring(width_key_index, article_img[i]['alt'].length)
                    img_width = img_width.replace('{{width ', '')
                    img_width = img_width.replace('}}', '')

                    article_img[i].setAttribute('style', 'width:' + (Number(img_width.replace('%', '')) * mobileSkale).toString() + '%')
                    article_img[i].style.display = 'block'
                    article_img[i].style.margin = '0 auto'
                }
            }

            // 设置 a 链接的点击事件，将 a 按照 Link 的方式进行跳转，避免页面不必要的刷新
            let article_link = document.getElementsByTagName('span');
            console.log(article_link);
            let links = []

            for (let i = 0; i < article_link.length; i++) {

                
                if (article_link[i].getAttribute('path') == undefined || article_link[i].getAttribute('path') == null) {
                    // 如果 DOM 中的元素**不**包含 path 属性，则跳过（有 path 属性的元素才需要处理）
                    continue
                }

                // 创建 Link 元素，当点击上述 span 原生时，将触发 Link 元素的点击事件
                let link_temp = <Link className='link_temp' to={article_link[i].getAttribute('path')}>Link</Link>
                links.push(link_temp)


                // DOM 中的特定元素点击时
                article_link[i].onclick = () => {
                    console.log('a click');

                    // 获取元素的 path 参数，提取 post id
                    let post_id = article_link[i].getAttribute('path').replace('/post/', '')
                    console.log(post_id);

                    // 获取自定义的 Link 元素
                    let my_links = document.getElementsByClassName('link_temp')

                    for (let j = 0; j < my_links.length; j++) {
                        console.log(my_links[j]);
                        console.log(my_links[j].href);

                        // 如果自定义的 Link 的 href 属性中包含 元素 path 属性的值，则可匹配
                        if (my_links[j].href.indexOf(article_link[i].getAttribute('path')) >= 0) {

                            // 点击
                            my_links[j].click()
                            // 页面滚动到顶部
                            window.scrollTo(0, 0);
                            
                            break
                        }
                    }

                }
            }

            // 设置自定义 Link 并渲染到 DOM 中
            if (my_link == '' && links.length > 0) {
                setLink(links)
            }

        }

    });


    // 加载中
    if (isLoading) {
        return <div></div>
    } else {


        let links = []

        // 反向链接
        let backLinksBox = <div className='markdown-body backLinks'>
            <header>Links to this page</header>
            <ul>
                👻
            </ul>
        </div>

        if (card['backLinks'].length > 0) {
            let backLinks = card['backLinks'].map((backLink) =>
                <li key={backLink.id} >
                    <Link to={{ pathname: '/post/' + backLink.id }} >
                        {/* <span onClick={this.handleBackLinkClick.bind(Event, backLink.id)}> */}
                        {backLink.title}
                        {/* </span> */}
                    </Link>
                </li>
            )

            backLinksBox = <div className='markdown-body backLinks'>
                <header>Links to this page</header>
                <ul>
                    {backLinks}
                </ul>
            </div>
        }



        return <div>

            <div>
                <div ref={post} className='markdown-body container'>

                    <article><ReactMarkdown children={card['card']['content']} rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm, { singleTilde: false }]} /></article>
                    {backLinksBox}
                    <ul style={{ display: 'none' }}>{my_link}</ul>


                </div>
            </div>
        </div>;
    }

}

export default Container;