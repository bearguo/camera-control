'use strict'
const SERVER_IP = window.location.hostname
const SERVER_PORT = "80"
// *****************************tab1****************************

    const GET_SETTING_URL = `http://${SERVER_IP}:${SERVER_PORT}/params`
    const SET_SETTING_URL = `http://${SERVER_IP}:${SERVER_PORT}/setting`

    $("#exposure-mode").on("change", function(){
        if($("#exposure-mode").val()==0){
            $("#brightness").attr("disabled", "disabled")
            $("#brightness").css("color", "#bbc2ca")
            $("#exposure-time").removeAttr("disabled")
            $("#exposure-time").css("color", "#3d4145")
        }else{
            $("#brightness").removeAttr("disabled")
            $("#brightness").css("color", "#3d4145")
            $("#exposure-time").attr("disabled", "disabled")
            $("#exposure-time").css("color", "#bbc2ca")
        }
    })

    $("#admin-clear").on("click", function () {
        initSetting()
    })

    $("#admin-submit").on("click", function () {
        let gain = $("#gain").val()
        let exposureMode = $("#exposure-mode").val()
        let exposureTime = $("#exposure-time").val()
        let brightness = $("#brightness").val()
        let frameRate = $("#frame-rate").val()
        let horizontalFlip = $("#horizontal-flip").val()
        let verticalFlip = $("#vertical-flip").val()
        let xhr = new XMLHttpRequest()
        xhr.open("POST", SET_SETTING_URL)
        xhr.setRequestHeader('content-type', 'application/json');
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                if (xhr.response === "ok") {
                    $.toast("设置成功!")
                }
                else {
                    $.toast("设置失败")
                }

            }
        }
        let form = {
            "gain": gain,
            "exposureMode": exposureMode,
            "exposureTime": exposureTime,
            "brightness": brightness,
            "frameRate": frameRate,
            "horizontalFlip": horizontalFlip,
            "verticalFlip": verticalFlip
        }
        xhr.send(JSON.stringify(form))
    })

    function initSetting() {
        let xhr = new XMLHttpRequest()
        xhr.open("GET", GET_SETTING_URL)
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                let result = JSON.parse(xhr.response)
                $("#gain").val(parseInt(result["gain"]))    
                $("#exposure-mode").val(result["exposureMode"])
                $("#exposure-time").val(result["exposureTime"])
                $("#brightness").val(result["brightness"])
                $("#frame-rate").val(result["frameRate"])
                $("#horizontal-flip").val(result["horizontalFlip"])
                $("#vertical-flip").val(result["verticalFlip"])
                if($("#exposure-mode").val()==0){
                    $("#brightness").attr("disabled", "disabled")
                    $("#brightness").css("color", "#bbc2ca")
                    $("#exposure-time").removeAttr("disabled")
                    $("#exposure-time").css("color", "#3d4145")
                }else{
                    $("#brightness").removeAttr("disabled")
                    $("#brightness").css("color", "#3d4145")
                    $("#exposure-time").attr("disabled", "disabled")
                    $("#exposure-time").css("color", "#bbc2ca")
                }
            }
        }
        xhr.send()
    }


// ***********************************tab2***********************
const RECORD_URL = `http://${SERVER_IP}:${SERVER_PORT}/record`
const PRINT_SCREEN_URL = `http://${SERVER_IP}:${SERVER_PORT}/print_screen`
let liveRefreshTimer = null
let liveRefreshFlag = false
let recordFlag = false
let recordTime = 0
let recordTimer = null

$("#tab-head1").on("click", function(){
    if(liveRefreshFlag){
        liveRefreshFlag = false
        clearInterval(liveRefreshTimer)
    }
})

$("#tab-head2").on("click", function(){
    if(!liveRefreshFlag && !recordFlag){
        liveRefreshFlag = true
        clearInterval(liveRefreshTimer)
        liveRefreshTimer = setInterval(()=>{
            try{
                $("#live-picture").attr("src", `./photo/live.jpg?${new Date().getTime()}`)
            }catch(err){}  
        },100)
    }
})

$("#tab-head3").on("click", function(){
    if(liveRefreshFlag){
        liveRefreshFlag = false
        clearInterval(liveRefreshTimer)
    }
})

$("#record-btn").on("click", function(){
    let xhr = new XMLHttpRequest()
    xhr.open("POST", RECORD_URL)
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            if (xhr.response === "ok") {
                recordFlag = !recordFlag
                if(recordFlag){
                    $("#record-btn").text("停止录制")
                    clearInterval(recordTimer)
                    recordTimer = setInterval(()=>{
                        recordTime += 1
                        $("#record-time").text(`${parseInt(recordTime/3600)}:${parseInt((recordTime%3600)/60)}:${parseInt(recordTime%60)}`)
                    },1000)
                }else{
                    $("#record-btn").text("开始录制")
                    liveRefreshFlag = false
                    clearInterval(liveRefreshTimer)
                    clearInterval(recordTimer)
                    recordTime = 0
                    $('#record-time').text('0:0:0')
                    getReplayList()
                }
            }else if(xhr.response === "no"){
                $.toast("其他用户正在录制")
            }else {
                $.toast("未知错误")
            }
        }
    }
    let form = {
        "record": Number(!recordFlag)
    }
    console.log(form)
    xhr.send(JSON.stringify(form))
})

$("#print-screen-btn").on("click", function(){
    let xhr = new XMLHttpRequest()
    xhr.open("POST", PRINT_SCREEN_URL)
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.onreadystatechange = function(){
        if (xhr.readyState == 4 && xhr.status == 200){
            if(xhr.response === "ok"){
                getPrintScreenList()  
            }else{
                $.toast("截图失败，未知错误1")
            }
        }
    }
    let form = {
        "printscreen": 1
    }
    xhr.send(JSON.stringify(form))
})

$("#live-btn").on("click", function(){
    if(!recordFlag && !liveRefreshFlag){
        liveRefreshFlag = true
        clearInterval(liveRefreshTimer)
        liveRefreshTimer = setInterval(()=>{
            try{
                $("#live-picture").attr("src", `./photo/live.jpg?${new Date().getTime()}`)
            }catch(err){}  
        },100)
    }
})

// ***********************************tab3***********************
const REPLAY_URL = `http://${SERVER_IP}:${SERVER_PORT}/replay_list`
const DELETE_REPLAY_URL = `http://${SERVER_IP}:${SERVER_PORT}/delete_replay`
const PRINT_SCREEN_LIST_URL = `http://${SERVER_IP}:${SERVER_PORT}/print_screen_list`
const DELETE_PRINT_SCREEN_URL = `http://${SERVER_IP}:${SERVER_PORT}/delete_print_screen`
let replay_list = {}
let print_screen_list = {}

$("#replay-list").on("click", function(){
    $("#replay-video").css("display", "")
    $("#print-screen").css("display", "none")
})

$("#replay-list").on("change", function(){
    $("#replay-video").css("display", "")
    $("#print-screen").css("display", "none")
    let recordNumber = $("#replay-list").val()
    if(recordNumber!=0){
        $("#replay-video").attr("src", `./record/${replay_list[recordNumber]["name"]}.mp4`)
    }
})

$("#print-screen-list").on("click", function(){
    $("#replay-video").css("display", "none")
    $("#print-screen").css("display", "")
})

$("#print-screen-list").on("change", function(){
    $("#replay-video").css("display", "none")
    $("#print-screen").css("display", "")
    let recordNumber = $("#print-screen-list").val()
    if(recordNumber!=0){
        $("#print-screen").attr("src", `./photo/${print_screen_list[recordNumber]["name"]}.jpg`)
    }
})

$("#delete-replay").on("click", function(){
    if($("#replay-list").val() == 0){
        return
    }
    let xhr = new XMLHttpRequest()
    xhr.open("POST", DELETE_REPLAY_URL)
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            if (xhr.response === "ok") {
                getReplayList()
                $("#replay-video").attr("src", ``)
                $("#replay-video").css("display", `none`)
            }else if (xhr.response === "no"){
                $.toast("其他用户正在观看，无法删除")
            }
            else {
                $.toast("未知错误")
            }
        }
    }
    let form = {
        "delete": replay_list[$("#replay-list").val()]["name"]
    }
    xhr.send(JSON.stringify(form))
})

$("#delete-print-screen").on("click", function(){
    if($("#print-screen-list").val() == 0){
        return
    }
    let xhr = new XMLHttpRequest()
    xhr.open("POST", DELETE_PRINT_SCREEN_URL)
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            if (xhr.response === "ok") {
                getPrintScreenList()
                $("#print-screen").attr("src", ``)
                $("#print-screen").css("display", "none")
            }else if (xhr.response === "no"){
                $.toast("其他用户正在观看，无法删除")
            }
            else {
                $.toast("未知错误")
            }
        }
    }
    let form = {
        "delete": print_screen_list[$("#print-screen-list").val()]["name"]
    }
    console.log(form)
    xhr.send(JSON.stringify(form))
})

function getReplayList(){
    $("#replay-list").empty()
    $("#replay-list").append(`<option value="0">请选择要播放的回看</option>`)
    let xhr = new XMLHttpRequest()
    xhr.open("GET", REPLAY_URL)
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            let result = JSON.parse(xhr.response)
            Object.keys(result).forEach((key)=>{
                replay_list[key] = result[key]
                $("#replay-list").append($(`<option value="${parseInt(key)}">${replay_list[key]["name"]}</option>`))
            })
        }
    }
    xhr.send()
}

function getPrintScreenList(){
    $("#print-screen-list").empty()
    $("#print-screen-list").append(`<option value="0">请选择要观看的截图</option>`)
    let xhr = new XMLHttpRequest()
    xhr.open("GET", PRINT_SCREEN_LIST_URL)
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            let result = JSON.parse(xhr.response)
            Object.keys(result).forEach((key)=>{
                print_screen_list[key] = result[key]
                $("#print-screen-list").append($(`<option value="${parseInt(key)}">${print_screen_list[key]["name"]}</option>`))
            })
        }
    }
    xhr.send()
}

$(function(){
    initSetting()
    getReplayList()
    getPrintScreenList()
})
