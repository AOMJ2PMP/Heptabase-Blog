import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { useLocation } from "react-router";

import Container from '../components/Container'
import Nav from '../components/Nav';
import Footer from '../components/Footer'
import Loading from '../components/Loading'

import '../index.css'
import 'github-markdown-css'

import { getHeptabaseData, getClearCard, getClearImag } from '../constantFunction'
import { id } from 'date-fns/locale';

import useHash from "../hooks/useHash";



let windowWidth = window.innerWidth
let minWidth = 600

// 文章页面
class Post extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            card: null //所有的 hepta 数据
            , main_card: null //首页卡片
            , cardList: [] // 当前页面的卡片列表
            , location: '' // 记录 URL
            , activeNote: 'null' // 记录当前焦点卡片 etc 3a433c0b-e2e1-4722......
        };
    }

    componentDidMount() {

        // 请求 hepta 数据 getHeptabaseData
        getHeptabaseData.then((res) => {

            let heptabase_blog_data = res.data

            // 将数据保存到 state 中
            this.setState({
                card: heptabase_blog_data,
                main_card: res['pages']['about']
            }, () => {

                // 渲染 URL、数据
                this.herfToData()
            })

        })

        // 监听 notes 容器滚动
        if (document.getElementsByClassName('notes')[0] !== undefined) {

            document.getElementsByClassName('notes')[0].addEventListener('scroll', this.setCardMiniTitleAndStyle)
        }

    }

    // 根据 card id 获取 card content
    findContent = (id, heptabase_blog_data) => {
        if (heptabase_blog_data === '') {
            return
        }

        let new_card = null
        console.log('Post findContent for:');
        for (let i = 0; i < heptabase_blog_data.cards.length; i++) {

            if (heptabase_blog_data.cards[i]['id'] == id) {

                // 处理内容中的图片
                heptabase_blog_data.cards[i] = getClearImag(heptabase_blog_data.cards[i])
                console.log('getClearImag done');
                // 处理内容中的链接
                new_card = getClearCard(heptabase_blog_data.cards[i], heptabase_blog_data.cards)
                heptabase_blog_data.cards[i] = new_card['card']

                return new_card

            }
        }

        return new_card

    }

    // 文章内链接、反向链接点击
    handleLinkClick = (link_id, current_id = undefined) => {

        // 设置当前活跃的笔记（用户焦点）
        if (this.state.activeNote !== link_id) {

            // 设置 state
            this.setState({
                activeNote: link_id
            }, () => {
                this.setUrlActiveNote(link_id)
            })

        }


        // 已经显示此卡片则不更新 URL 和数据
        let bingo = false
        this.state.cardList.forEach(item => {

            if (link_id === item['card']['id']) {

                bingo = true

            }

        });

        if (bingo || current_id === undefined || current_id === null) {

            return
        }

        // 删除 Link 所在 card 后的所有 URL 参数
        // let url_search = window.location.search
        // url_search = url_search.replace('?', '')
        // url_search = url_search.replace(/&/gi, '')
        // let url_search_list = url_search.split('note-id=')

        let getUrlSearch_req = this.getUrlSearch(window.location.search)
        let url_search_list = getUrlSearch_req['url_search_list']

        let new_url_search = ''
        let current_page_index = -1
        for (let i = 0; i < url_search_list.length; i++) {

            if (url_search_list[i] === '') {
                continue
            }

            if (url_search_list[i] === current_id) {
                // URL 参数 === current_id
                current_page_index = i
            } else {
                // URL 参数 !== current_id
            }

            if (new_url_search == '') {
                new_url_search += '?note-id=' + url_search_list[i]
            } else {
                new_url_search += '&note-id=' + url_search_list[i]
            }

            //如果当前 id === current_id，则忽略后面的所有 ID
            if (current_page_index > -1) {
                break;
            }
        }

        if (new_url_search == '') {
            new_url_search += '?note-id=' + link_id
        } else {
            new_url_search += '&note-id=' + link_id
        }


        new_url_search += '&active-note-id=' + link_id

        // 设置 URL
        window.history.pushState({}, '', window.location.origin + '/post' + new_url_search)
        // 记录 URL
        this.setState({
            location: window.location.href
        })


        // 删除 URL 中不存在的 Card
        this.resetCardList()
        // 根据 URL 获取 card 数据
        this.herfToData()

    }

    herfToData = () => {

        // 首页的情况
        if (window.location.search === '') {

            // 找到首页卡片的 ID
            let main_id = this.state.main_card['id']
            // 设置 URL
            window.location.replace(window.location.origin + '/post?note-id=' + main_id)

        }

        // 从 URL 中获取 note id，根据 id 获取卡片数据
        let card_list = []
        let getUrlSearch_req = this.getUrlSearch(window.location.search)
        let url_search_list = getUrlSearch_req['url_search_list']

        for (let i = 0; i < url_search_list.length; i++) {
            if (url_search_list[i] == '') {
                continue
            }
            // 将数据保存到 card list 中
            card_list.push(this.findContent(url_search_list[i], this.state.card))

        }

        // 设置当前活跃的笔记（用户焦点）
        let activeNote
        if (getUrlSearch_req['active_str'] !== '') {
            activeNote = getUrlSearch_req['active_str'].replace('active-note-id=', '')
        } else {
            activeNote = card_list[card_list.length - 1]['card']['id']
        }



        // 收集 card 数据后一次性 setState（在 for 内分多次 setState 的话容易丢失数据）
        if (this.state.activeNote !== activeNote) {
            this.setState({
                cardList: card_list,
                activeNote: activeNote
            }, () => {
                // 更新 URL
                this.setUrlActiveNote(activeNote)
            })
        }





    }

    // 当 URL 变化时（子组件 container 载入完毕后也会调用此方法）
    handleHashChange = (url) => {

        setTimeout(() => {
            let note_list = document.getElementsByClassName('container')
            let foucus_note = this.state.activeNote

            let target_note_offsetLeft = 0
            for (let j = 0; j < note_list.length; j++) {
                let note = note_list[j]

                // 定位到当前用户关注的笔记
                if (note.getAttribute('note_id') === foucus_note) {

                    if (windowWidth > minWidth) {
                        console.log(target_note_offsetLeft);
                        document.getElementsByClassName('notes')[0].scrollTo({ left: j * 650, behavior: 'smooth' })
                    } else {

                    }

                    break;

                }

                target_note_offsetLeft += note.clientWidth
            }

            // 设置样式、小标题
            this.setCardMiniTitleAndStyle()

        }, 100);

        // 如果 url 发生变化，则更新数据
        let old_url = this.getUrlSearch(this.state.location)
        let new_url = this.getUrlSearch(url)

        let old_url_1 = old_url['url_search_list'].join('-')
        let new_url_1 = new_url['url_search_list'].join('-')

        // 数据发生变化（忽略焦点变化）
        if (new_url_1 !== old_url_1) {

            // 将当前 URL 保存到 state 中
            this.setState({
                location: url
            }, () => {

                if (this.state.location !== '') {

                    // cardList 中不存在 URL 的某一个 card
                    // 加载此 card 的数据
                    this.herfToData()

                }

            })



        }

        // 焦点发生变化
        if (old_url['active_str'] !== new_url['active_str']) {

            // 将当前 URL 保存到 state 中
            this.setState({
                location: url
            }, () => {

                if (this.state.location !== '') {
                    // 记录新焦点到 state 中
                    let new_active_note_id = new_url['active_str'].replace('active-note-id=', '')
                    this.setState({
                        activeNote: new_active_note_id
                    })
                }

            })



        }

        // 删除 URL 中不存在的 Card
        this.resetCardList()

    }

    // 删除 URL 中不存在的 Card
    resetCardList = () => {
        let url = window.location.href
        //比对 url 和 cardList
        for (let i = 0; i < this.state.cardList.length; i++) {
            // url 中不存在此 card
            if (url.indexOf(this.state.cardList[i]['card']['id']) < 0) {

                // 删除 card
                this.state.cardList.splice(i, 1)
                this.setState({
                    cardList: this.state.cardList
                })

            } else {
                // url 中存在此 card
                // continue
            }

        }

    }

    // 设置小标题
    setCardMiniTitleAndStyle = () => {

        let notes = document.getElementsByClassName('container')

        // console.log('setCardMiniTitleAndStyle');

        for (let j = 0; j < notes.length; j++) {

            // 小标题

            let type = 0 // 记录标题在左侧还是右侧
            let note // 记录需要添加标题的节点

            // 判断卡片的位置，当遮挡前 1 个卡片时，前 1 个卡片显示垂直标题
            let left_mark = notes[j].getBoundingClientRect().x <= j * 40
            // 判断是否要显示右侧标题
            let right_mark = notes[j].getBoundingClientRect().x + 1 >= window.innerWidth - (notes.length - j) * 40

            // 左侧小标题
            if (right_mark !== true) {

                if (left_mark) {

                    if (j !== 0) {
                        type = 1
                        note = notes[j - 1]
                    }

                } else {

                    // 移除小标题
                    if (j !== 0) {
                        note = notes[j - 1]
                    }

                    if (note !== undefined) {
                        let note_title = note.getElementsByClassName('note_title')[0]
                        if (note_title !== undefined) {

                            // 移除标题父级容器的类名标记
                            note.classList.remove('mini')

                            // 移除前一个元素的垂直标题
                            note.removeChild(note_title)
                        }
                    }

                }

            }


            // 右侧小标题
            if (left_mark !== true) {

                if (right_mark) {

                    type = 2
                    note = notes[j]
                    // 添加悬浮样式
                    // note.classList.add('overlay')

                } else {
                    // 移除小标题
                    note = notes[j]

                    if (note !== undefined && j !== 0) {
                        let note_title = note.getElementsByClassName('note_title')[0]
                        if (note_title !== undefined) {

                            // 移除标题父级容器的类名标记
                            note.classList.remove('mini')

                            // 移除前一个元素的垂直标题
                            note.removeChild(note_title)
                        }
                    }

                    // 移除悬浮样式
                    // note.classList.remove('overlay')
                }

            }


            // 需要显示小标题
            if (type > 0) {

                // 如果元素无标题
                if (note.classList.contains('mini') == false) {
                    // 前一个元素显示垂直标题
                    let note_title = document.createElement('div')
                    note_title.classList.add('note_title')

                    if (type === 1) {
                        note_title.style.left = (j - 1) * 40 + 'px'
                    } else {
                        note_title.style.right = (notes.length - j) * 40 - 40 + 'px'
                    }

                    // 小标题文案
                    let note_title_span = document.createElement('p')

                    if (note.getElementsByTagName('H1').length === 0) {
                        // 如果笔记中没有 H1 标题
                        note_title_span.innerHTML = note.innerText.substring(0, 6) + '...'
                    } else {
                        note_title_span.innerHTML = note.getElementsByTagName('H1')[0].innerHTML
                    }

                    note_title_span.onclick = (event) => {
                        console.log(event);
                        console.log(event.target.innerText);
                        console.log(note.getAttribute('note_id'));
                        this.handleLinkClick(note.getAttribute('note_id'))
                    }

                    // 小标题关闭按钮
                    let note_close_button = document.createElement('span')
                    note_close_button.innerHTML = '<svg t="1670226356192" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2683" width="16" height="16"><path d="M557.2 512l233.4-233.4c12.5-12.5 12.5-32.8 0-45.2s-32.8-12.5-45.2 0L512 466.8 278.6 233.4c-12.5-12.5-32.8-12.5-45.2 0s-12.5 32.8 0 45.2L466.8 512 233.4 745.4c-12.5 12.5-12.5 32.8 0 45.2 6.2 6.2 14.4 9.4 22.6 9.4s16.4-3.1 22.6-9.4L512 557.2l233.4 233.4c6.2 6.2 14.4 9.4 22.6 9.4s16.4-3.1 22.6-9.4c12.5-12.5 12.5-32.8 0-45.2L557.2 512z" p-id="2684"></path></svg>'
                    note_close_button.classList.add('note_close_button')
                    note_close_button.onclick = (event) => {

                        // 点击关闭按钮

                        this.handleCardCloseClick(note.getAttribute('note_id'))
                    }

                    note_title.appendChild(note_title_span)
                    note_title.appendChild(note_close_button)
                    note.appendChild(note_title)

                    note.classList.add('mini')
                }

            }

            // 样式
            if (j !== 0) {
                if (notes[j].getBoundingClientRect().x < notes[j - 1].getBoundingClientRect().x + notes[j - 1].getBoundingClientRect().width) {
                    notes[j].classList.add('overlay')
                } else {
                    notes[j].classList.remove('overlay')
                }
            }


        }
    }

    // 关闭卡片
    handleCardCloseClick = (note_id) => {

        console.log('handleCardCloseClick');
        // 修改 URL
        let new_url = window.location.href.replace('note-id=' + note_id, '')
        // 设置 URL
        window.history.pushState({}, '', new_url)

        // 记录 URL
        this.setState({
            location: window.location.href
        })

        // 从 UI 中隐藏卡片？？

    }

    // 获取 URL 参数
    getUrlSearch = (location_search) => {

        let url_search = location_search.replace('?', '')
        url_search = url_search.replace(/&/gi, '')

        // 忽略焦点卡片
        let active_str = '' // 焦点卡片参数名称及其值
        let active_index = url_search.indexOf('active-note-id')
        if (active_index > -1) {
            let is_last_index = url_search.indexOf('note-id', active_index + 14)
            if (is_last_index > -1) {
                // 焦点卡片不是最后一个参数
                active_str = url_search.substring(active_index, is_last_index)
            } else {
                // 焦点卡片是最后一个参数
                active_str = url_search.substring(active_index, url_search.length)
            }

        }

        url_search = url_search.replace(active_str, '')

        let url_search_list = url_search.split('note-id=')

        return { 'url_search_list': url_search_list, 'active_str': active_str }

    }

    // 将焦点卡片 ID 写入 URL
    setUrlActiveNote = (note_id) => {

        // 获取 URL 中的焦点卡片信息
        let getUrlSearch_req = this.getUrlSearch(window.location.search)
        let active_str = getUrlSearch_req['active_str']

        let new_url_search = window.location.search

        if (active_str === '') {
            // URL 中无焦点卡片

            new_url_search = new_url_search + '&active-note-id=' + note_id

        } else {
            // URL 中有焦点卡片

            // 如果焦点卡片无变化，则不更新
            if (active_str.indexOf(note_id) > -1) {
                return
            }

            new_url_search = new_url_search.replace(active_str, 'active-note-id=' + note_id)
        }


        // 删除旧卡片、写入新卡片


        // 设置 URL
        window.history.pushState({}, '', window.location.origin + '/post' + new_url_search)

        // 记录 URL
        this.setState({
            location: window.location.href
        })

    }




    render() {
        if (this.state.card === null || this.state.cardList.length === 0) {
            return (<div>
                <Nav />
                <div className='notes'>
                    <Loading />
                </div>
                <Footer />
            </div>)
        } else {

            // console.log(this.state.activeNote);

            let card_list_dom = []

            //如果屏幕宽度较小，则只显示 1 条笔记
            if (windowWidth < minWidth) {

                // 获取用户关注的笔记进行展示

                let card = this.state.cardList[this.state.cardList.length - 1]

                for (let k = 0; k < this.state.cardList.length; k++) {
                    if (this.state.cardList[k]['card']['id'] === this.state.activeNote) {
                        card = this.state.cardList[k]
                        break;
                    }
                }

                //设置笔记样式
                // left = index*40px; right = index*-40-400
                let note_style = {
                    left: 0
                }
                card_list_dom.push(<Container style={note_style} key={card['card']['id']} handleHashChange={this.handleHashChange} handleLinkClick={this.handleLinkClick} card={card} />)
            } else {
                for (let i = 0; i < this.state.cardList.length; i++) {
                    let card = this.state.cardList[i]

                    //设置笔记样式
                    // left = index*40px; right = index*-40-400
                    let note_style = {
                        left: i * 40 + 'px',
                        right: -694.8 + (this.state.cardList.length - i) * 40 + 'px',
                        flex: '0 0 auto'
                    }

                    let note = <Container style={note_style} key={card['card']['id']} handleHashChange={this.handleHashChange} handleLinkClick={this.handleLinkClick} card={card} />
                    card_list_dom.push(note)
                }
            }

            // 设置网页标题
            for (let k = 0; k < this.state.cardList.length; k++) {
                if (this.state.cardList[k]['card']['id'] === this.state.activeNote) {

                    if (this.state.cardList[k]['card']['title'] !== 'About') {
                        document.title = this.state.cardList[k]['card']['title']
                    } else {
                        document.title = 'Jiang 的数字花园🌱'
                    }

                    break;
                }
            }

            return (<div className='notes_box'>

                <Nav />
                {/* <Container card={card} /> */}
                <div className='notes'>
                    {card_list_dom}
                </div>

                {/* <Footer /> */}

            </div>)
        }
    }



}

export default Post;