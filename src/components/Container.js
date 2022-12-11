import React, { useState, useEffect, useRef, useUrlState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import { useLocation } from "react-router";

import { format } from 'date-fns'

import '../index.css'
import 'github-markdown-css'
import Loading from '../components/Loading'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'


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

    // 记录当前文章的 ID
    let [thisPageId, setPageID] = useState('')

    // 记录自定义的 Link 数据，用来实现 DOM 链接的间接跳转
    // let [my_link, setLink] = useState('');

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

    // 点击反向链接
    const handleBackLinkClick = (link_id, current_id) => {
        console.log('handleBackLinkClick');
        console.log(link_id);
        // 记录跳转类型
        sessionStorage.setItem('nav_type', 0)
        // 记录当前滚动的位置
        sessionStorage.setItem('scrollY', window.scrollY)

        props.handleLinkClick(link_id, current_id)

    }

    // 点击文内链接
    const handleAarticleLinkClick = (node) => {
        // console.log(node);

        if (node !== undefined) {

            if (node.classList.contains('article_link') !== true || node.getAttribute('path') === undefined || node.getAttribute('path') === null) {
                // 如果 DOM 中的元素**不**包含 path 属性，则跳过（有 path 属性的元素才需要处理）

            } else {
                let post_id = node.getAttribute('path').replace('/post/', '')
                let parent_note_id = node.getAttribute('parent_note_id')
                node.addEventListener('click', function () {
                    // 记录跳转类型
                    sessionStorage.setItem('nav_type', 1)
                    // 记录当前滚动的位置
                    sessionStorage.setItem('scrollY', window.scrollY)
                    props.handleLinkClick(post_id, parent_note_id)
                })
            }

        }

    }

    const { pathname } = useLocation();
    // 组件生命周期，组件载入、更新时将触发此函数
    useEffect(() => {

        console.log('useEffect');
        props.handleHashChange(window.location.href, props['card'])

        // dom 加载完毕后
        if (post.current != null) {

            // 设置网易云音乐播放器的尺寸

            // 设置 img 的尺寸
            let article_img = document.getElementsByTagName('img');

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
            let article_link = document.getElementsByClassName('article_link');

            let links = []

            for (let i = 0; i < article_link.length; i++) {

                if (article_link[i].classList.contains('article_link') !== true || article_link[i].getAttribute('path') === undefined || article_link[i].getAttribute('path') === null) {
                    // 如果 DOM 中的元素**不**包含 path 属性，则跳过（有 path 属性的元素才需要处理）
                    continue
                }

                setTimeout(() => {

                    handleAarticleLinkClick(article_link[i])

                }, 10);

            }

            // 设置自定义 Link 并渲染到 DOM 中
            // if (my_link == '' && links.length > 0) {
            //     setLink(links)
            // }

            // 滚动到对应卡片的位置
            setTimeout(() => {
                let last_note = document.getElementsByClassName('container')
                // console.log(last_note[last_note.length - 1]);
                // document.getElementsByClassName('notes')[0].scrollTo({ left: last_note[last_note.length - 1].offsetLeft, behavior: 'smooth' })
            }, 100);


        }


    });

    // 加载中
    if (false) {
        console.log('isLoading');

        return <Loading />


    } else {

        let links = []

        // 反向链接
        let backLinksBox = <div className='markdown-body backLinks'>
            <header>🔗LINKS TO THIS PAGE</header>
            <ul>
                👻
            </ul>
        </div>

        if (props['card']['backLinks'].length > 0) {
            let backLinks = props['card']['backLinks'].map((backLink) =>
                <li key={backLink.id} >

                    {/* <Link key={backLink.id} to={{ pathname: '/post/' + backLink.id }} > */}
                    <span className='my_link' key={backLink.id} onClick={handleBackLinkClick.bind(this, backLink.id, props['card']['card']['id'])}>
                        {backLink.title}
                    </span>
                    {/* </Link> */}

                </li>
            )

            backLinksBox = <div className='markdown-body backLinks'>
                <header>🔗LINKS TO THIS PAGE</header>
                <ul>
                    {backLinks}
                </ul>
            </div>
        }



        return <div style={props['style']} ref={post} className='markdown-body container' note_id={props['card']['card']['id']}>

            <article>

                <ReactMarkdown children={props['card']['card']['content']}
                    components={{
                        code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                                <SyntaxHighlighter
                                    children={String(children).replace(/\n$/, '')}
                                    style={atomDark}
                                    language={match[1]}
                                    PreTag="div"
                                    {...props}
                                />
                            ) : (
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            )
                        }
                    }}
                    rehypePlugins={[rehypeRaw]}
                    remarkPlugins={[remarkGfm, { singleTilde: false }]} /></article>
            <div className='postTime'>
                <time>Created {format(new Date(props['card']['card']['createdTime']), 'yyyy-MM-dd')}</time>
                <time>{props['card']['card']['lastEditedTimeDiff']}</time>
            </div>
            {/* /反向链接 */}
            {backLinksBox}


        </div>
    }

}

export default Container;