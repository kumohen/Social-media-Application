import axios from 'axios'
export default class RegistrationForm{
    constructor(){
        this._csrf = document.querySelector('[name:"_csrf"]').value()
        this.form = document.querySelector("#registration-form")
        this.allFields = document.querySelectorAll("#registration-form .form-control")
        this.insertValidationElements()
        this.username = document.querySelector("#username-register")
        this.email = document.querySelector("#email-register")
        this.password = document.querySelector("#password-register")
        this.username.previousValue = ""
        this.email.previousValue = ""
        this.password.previousValue = ""
        this.username.isUnique = false
        this.email.isUnique = false
        this.events()

    }
    events(){
        this.form.addEventListener("submit",(e)=>{
            e.preventDefault()
            this.formSubmitHandler()
        })
        this.username.addEventListener("keyup",()=>{
            this.isDifferent(this.username,this.usernameHandler)
        })
        this.email.addEventListener("keyup",()=>{
            this.isDifferent(this.email,this.emailHandler)
        })
        this.password.addEventListener("keyup",()=>{
            this.isDifferent(this.password,this.passwordHandler)
        })
        this.username.addEventListener("blur",()=>{
            this.isDifferent(this.username,this.usernameHandler)
        })
        this.email.addEventListener("blur",()=>{
            this.isDifferent(this.email,this.emailHandler)
        })
        this.password.addEventListener("blur",()=>{
            this.isDifferent(this.password,this.passwordHandler)
        })
    }
    formSubmitHandler(){
        this.usernameImmedately()
        this.usernameAfterDelay()
        this.emailAfterDelay()
        this.passwordImmedately()
        this.passwordAfterDelay()
        if(this.username.isUnique && !this.username.errors && this.email.isUnique && !this.email.errors && !this.password.errors){
            this.form.submit()
        }
    }
    isDifferent(el,handler){
        if(el.previousValue != el.value){
            handler.call(this)
        }
        el.previousValue = el.value
    }
    usernameHandler(){
        this.username.errors = false
        this.usernameImmedately()
        clearTimeout(this.username.timer)
        this.username.timer = setTimeout(()=>{
            this.usernameAfterDelay()
        },2000)
      
    }
    emailHandler(){
        this.email.errors = false
      
        clearTimeout(this.email.timer)
        this.email.timer = setTimeout(()=>{
            this.emailAfterDelay()
        },1000)
      
    }
    passwordHandler(){
        this.password.errors = false
        this.passwordImmedately()
        clearTimeout(this.password.timer)
        this.email.timer = setTimeout(()=>{
            this.passwordAfterDelay()
        },1000)
      
    }
    passwordImmedately(){
        if(this.password.value.length > 30 ){
            this.showValidationError(this.password,"password show be more than 4 character")
        }
        if(!this.password.errors){
            this.hideValidationError(this.password)
        }
    }
    passwordAfterDelay(){
        if(this.password.value.length < 5){
            this.showValidationError(this.password,"password show be greater than 4 character")   
        }
    }

    emailAfterDelay(){
        if(!/^\S+@\S+$/.test(this.email.value)){
            this.showValidationError(this.email,"You must provide validate email")
        }
        if(!this.email.errors){
            axios.post(`/doesEmailExist`,{_csrf:this._csrf,email:this.email.value}).then((response)=>{
                if(response.data){
                    this.email.isUnique = false
                    this.showValidationError(this.email,"this email is already exist ")
                }else{
                    this.email.isUnique = true
                    this.hideValidationError(this.email)
                }
            }).catch(()=>{
                console.log("plz try again")
            })
        }
    }
    usernameImmedately(){
       if(this.username.value != "" && !/^([a-zA-Z0-9]+)$/.test(this.username.value)){
            this.showValidationError(this.username,"username only contains letter and number")
       }
       if(this.username.value.length > 20){
           this.showValidationError(this.username,"username can not excede 20 character")
       }
       if(!this.username.errors){
           this.hideValidationError(this.username)
       }
    }
    hideValidationError(el){
        el.nextElementSibling.classList.remove("liveValidateMessage--visible")
    }
    showValidationError(el,message){
        el.nextElementSibling.innerHTML = message
        el.nextElementSibling.classList.add("liveValidateMessage--visible")
        el.errors = true
    }
    usernameAfterDelay(){
        if(this.username.value.length < 3){
            this.showValidationError(this.username,"username can not less than 3 character")
        }
        if(!this.username.errors){
            axios.post(`/doesUsernameExist`,{_csrf:this._csrf,username:this.username.value}).then((response)=>{
                if(response.data){
                    this.showValidationError(this.username,"username already exist")
                    this.username.isUnique = false
                }else{
                    this.username.isUnique = true
                }
            }).catch(()=>{
                console.log("something is going worng")
            })
        }
    }
    insertValidationElements(){
        this.allFields.forEach(function(element){
            element.insertAdjacentHTML('afterend',`<div class="alert alert-danger small liveValidateMessage "></div>`)  
        })
    }
}