'use strict'
const SERVER_IP = window.location.hostname
const SERVER_PORT = "5501"
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
    let liveRefreshTimer = null
    let liveRefreshFlag = false
    $("#tab-head1").on("click", function(){
        if(liveRefreshFlag){
            liveRefreshFlag = false
            clearInterval(liveRefreshTimer)
        }
        
    })

    $("#tab-head2").on("click", function(){
        if(!liveRefreshFlag){
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

// ***********************************tab3***********************

const RECORD_URL = `http://${SERVER_IP}:${SERVER_PORT}/record`
const REPLAY_URL = `http://${SERVER_IP}:${SERVER_PORT}/replay_list`
const DELETE_REPLAY_URL = `http://${SERVER_IP}:${SERVER_PORT}/delete_replay`
let replay_list = {}
let recordFlag = false
let recordTime = 0
let recordTimer = null
let replayInterval = null
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
                    clearInterval(recordTimer)
                    recordTime = 0
                    $('#record-time').text('0:0:0')
                    getReplayList()
                }
            }
            else {
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

$("#replay-list").on("change", function(){
    let recordNumber = $("#replay-list").val()
    if(recordNumber!=0){
        let startPhoto = replay_list[recordNumber]["startPhoto"]
        $("#replay-photo").attr("src", `./record/${replay_list[recordNumber]["name"]}/${startPhoto}.jpg`)
    }
})

$("#delete-replay").on("click", function(){
    let xhr = new XMLHttpRequest()
    xhr.open("POST", DELETE_REPLAY_URL)
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            if (xhr.response === "ok") {
                clearInterval(replayInterval)
                getReplayList()
                $("#replay-photo").attr("src", ``)
            }
            else {
                $.toast("未知错误")
            }
        }
    }
    let form = {
        "delete": replay_list[$("#replay-list").val()]["name"]
    }
    console.log(form)
    xhr.send(JSON.stringify(form))
})

$("#start-replay").on("click", function(){
    let recordNumber = $("#replay-list").val()
    let pathForder = replay_list[recordNumber]["name"]
    let startPhoto = parseInt(replay_list[recordNumber]["startPhoto"])
    let photoNumber = parseInt(replay_list[recordNumber]["photoNumber"])
    let photoCount = 0
    clearInterval(replayInterval)
    replayInterval = setInterval(()=>{
        if(photoCount<photoNumber){
            $("#replay-photo").attr("src", `./record/${pathForder}/${startPhoto+photoCount}.jpg`)
            photoCount += 1
        }else{
            clearInterval(replayInterval)
        }
    }, 1000)
})

$("#stop-replay").on("click", function(){
    clearInterval(replayInterval)
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



$(function(){
    initSetting()
    getReplayList()
    /* chrome 不支持 onbeforeunload 中添加方法，改为心跳包 已弃用
    const LOGIN_URL = `http://${SERVER_IP}:${SERVER_PORT}/login`
    setInterval(()=>{
        $.ajax({
            type: "GET",
            url: LOGIN_URL
        })
    },1000*5)
    $.ajax({
        type: "GET",
        url: LOGIN_URL,
        success:(result)=>{
             if(result["visiting"]!="0"){
                 $.toast("有其他用户在访问管理页面，请不要更改设置")
             }
        }
    })
    */
})
